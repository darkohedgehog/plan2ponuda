import { createHash, randomBytes } from "node:crypto";

import { Prisma } from "../../../generated/prisma/client";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { hasCompleteSmtpServerEnv } from "@/lib/utils/smtp-env";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignUpInput,
} from "@/lib/validations/auth.schema";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createCompositeRateLimitKey,
  createUserRateLimitKey,
  type RateLimitExceededStatus,
} from "@/server/services/rate-limit-service";
import { sendPasswordResetEmail } from "@/server/services/mail-service";
import type { SignUpResponse } from "@/types/auth";

const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for this email, password reset instructions will be sent.";
const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function createEmailVerificationToken(): string {
  return randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString("base64url");
}

function createPasswordResetToken(): string {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
}

function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildEmailVerificationUrl(baseUrl: string, token: string): string {
  const verificationUrl = new URL("/verify-email", baseUrl);
  verificationUrl.searchParams.set("token", token);

  return verificationUrl.toString();
}

function buildResetUrl(baseUrl: string, token: string): string {
  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export async function createUserWithPassword(
  input: SignUpInput,
  baseUrl?: string,
): Promise<SignUpResponse> {
  const email = normalizeEmail(input.email);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      ok: false,
      error: {
        code: "email_already_exists",
        message: "An account with this email already exists.",
      },
    };
  }

  try {
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        fullName: input.fullName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const devVerificationUrl = await prepareEmailVerification({
      baseUrl,
      email: user.email,
      userId: user.id,
    });
    const response: SignUpResponse = {
      ok: true,
      user,
    };

    if (devVerificationUrl) {
      response.devVerificationUrl = devVerificationUrl;
    }

    return response;
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: {
          code: "email_already_exists",
          message: "An account with this email already exists.",
        },
      };
    }

    throw error;
  }
}

async function prepareEmailVerification(params: {
  baseUrl?: string;
  email: string;
  exposeDevVerificationUrl?: boolean;
  logDevVerificationUrl?: boolean;
  userId: string;
}): Promise<string | undefined> {
  const rawToken = createEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: {
      expiresAt,
      tokenHash,
      userId: params.userId,
    },
  });

  if (!params.baseUrl) {
    console.error("Email verification delivery skipped: missing app URL");

    return undefined;
  }

  const verificationUrl = buildEmailVerificationUrl(params.baseUrl, rawToken);

  const exposeDevVerificationUrl = params.exposeDevVerificationUrl ?? true;
  const logDevVerificationUrl = params.logDevVerificationUrl ?? true;

  if (process.env.NODE_ENV !== "production" && logDevVerificationUrl) {
    console.info("Development email verification URL", verificationUrl);
  }

  if (shouldSendEmailVerificationEmail()) {
    const { sendEmailVerificationEmail } = await import(
      "@/server/services/mail-service"
    );

    await sendEmailVerificationEmail({
      toEmail: params.email,
      verificationUrl,
    }).catch((error: unknown) => {
      console.error(
        "Email verification delivery failed",
        getSafeEmailErrorDetails(error),
      );
    });
  }

  return process.env.NODE_ENV !== "production" && exposeDevVerificationUrl
    ? verificationUrl
    : undefined;
}

export type ResendVerificationEmailResult =
  | {
      ok: true;
      status: "already_verified" | "sent";
    }
  | {
      ok: false;
      rateLimitStatus: RateLimitExceededStatus;
      reason: "rate_limited";
    };

export async function resendVerificationEmailForUser(params: {
  baseUrl?: string;
  userId: string;
}): Promise<ResendVerificationEmailResult> {
  const user = await prisma.user.findUnique({
    select: {
      email: true,
      emailVerifiedAt: true,
      id: true,
    },
    where: {
      id: params.userId,
    },
  });

  if (!user) {
    return {
      ok: true,
      status: "sent",
    };
  }

  if (user.emailVerifiedAt) {
    return {
      ok: true,
      status: "already_verified",
    };
  }

  const rateLimit = await checkRateLimitOrThrow({
    key: createUserRateLimitKey({
      userId: user.id,
    }),
    scope: RATE_LIMIT_SCOPES.resendEmailVerification,
    ...RATE_LIMIT_POLICIES.resendEmailVerification,
  }).catch((error: unknown) => {
    if (error instanceof RateLimitExceededError) {
      return error.status;
    }

    throw error;
  });

  if (!rateLimit.ok) {
    return {
      ok: false,
      rateLimitStatus: rateLimit,
      reason: "rate_limited",
    };
  }

  await prepareEmailVerification({
    baseUrl: params.baseUrl,
    email: user.email,
    exposeDevVerificationUrl: false,
    logDevVerificationUrl: false,
    userId: user.id,
  });

  return {
    ok: true,
    status: "sent",
  };
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const tokenHash = hashEmailVerificationToken(token);
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const verificationToken =
      await transaction.emailVerificationToken.findUnique({
        select: {
          expiresAt: true,
          id: true,
          usedAt: true,
          userId: true,
        },
        where: {
          tokenHash,
        },
      });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt.getTime() <= now.getTime()
    ) {
      return false;
    }

    await transaction.user.update({
      data: {
        emailVerifiedAt: now,
      },
      where: {
        id: verificationToken.userId,
      },
    });

    await transaction.emailVerificationToken.update({
      data: {
        usedAt: now,
      },
      where: {
        id: verificationToken.id,
      },
    });

    await transaction.emailVerificationToken.updateMany({
      data: {
        usedAt: now,
      },
      where: {
        id: {
          not: verificationToken.id,
        },
        userId: verificationToken.userId,
        usedAt: null,
      },
    });

    return true;
  });
}

export async function isUserEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    select: {
      emailVerifiedAt: true,
    },
    where: {
      id: userId,
    },
  });

  return Boolean(user?.emailVerifiedAt);
}

export type RequestPasswordResetResult =
  | {
      devResetUrl?: string;
      message: string;
      ok: true;
    }
  | {
      ok: false;
      reason: "rate_limited";
    };

export async function requestPasswordReset(
  input: ForgotPasswordInput,
  ipAddress: string,
  baseUrl?: string,
): Promise<RequestPasswordResetResult> {
  const email = normalizeEmail(input.email);
  const rateLimitKey = createCompositeRateLimitKey([
    {
      kind: "email",
      value: email,
    },
    {
      kind: "ip",
      value: ipAddress,
    },
  ]);

  const rateLimit = await checkRateLimitOrThrow({
    key: rateLimitKey,
    scope: RATE_LIMIT_SCOPES.forgotPassword,
    ...RATE_LIMIT_POLICIES.forgotPassword,
  }).catch((error: unknown) => {
    if (error instanceof RateLimitExceededError) {
      return null;
    }

    throw error;
  });

  if (!rateLimit) {
    return {
      ok: false,
      reason: "rate_limited",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      email: true,
      id: true,
    },
  });
  const result: RequestPasswordResetResult = {
    ok: true,
    message: PASSWORD_RESET_SUCCESS_MESSAGE,
  };

  if (!user) {
    return result;
  }

  const rawToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      expiresAt,
      tokenHash,
      userId: user.id,
    },
  });

  if (!baseUrl) {
    console.error("Password reset email delivery skipped: missing app URL");

    return result;
  }

  const devResetUrl = buildResetUrl(baseUrl, rawToken);

  if (process.env.NODE_ENV !== "production") {
    console.info("Development password reset URL", devResetUrl);
  }

  if (shouldSendPasswordResetEmail()) {
    await sendPasswordResetEmail({
      resetUrl: devResetUrl,
      toEmail: user.email,
    }).catch((error: unknown) => {
      console.error(
        "Password reset email delivery failed",
        getSafeEmailErrorDetails(error),
      );
    });
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      ...result,
      devResetUrl,
    };
  }

  return result;
}

export type ResetPasswordResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "invalid_or_expired_token";
    };

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ResetPasswordResult> {
  const tokenHash = hashPasswordResetToken(input.token);
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const resetToken = await transaction.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        expiresAt: true,
        id: true,
        usedAt: true,
        userId: true,
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= now.getTime()
    ) {
      return {
        ok: false,
        reason: "invalid_or_expired_token",
      };
    }

    const passwordHash = await hashPassword(input.password);

    await transaction.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        passwordHash,
      },
    });

    await transaction.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: now,
      },
    });

    await transaction.passwordResetToken.updateMany({
      where: {
        id: {
          not: resetToken.id,
        },
        userId: resetToken.userId,
        usedAt: null,
      },
      data: {
        usedAt: now,
      },
    });

    return {
      ok: true,
    };
  });
}

function shouldSendPasswordResetEmail(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    hasCompleteSmtpServerEnv(process.env)
  );
}

function shouldSendEmailVerificationEmail(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    hasCompleteSmtpServerEnv(process.env)
  );
}

function getSafeEmailErrorDetails(error: unknown): { name: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
    };
  }

  return {
    name: "UnknownError",
  };
}
