import { createHash, randomBytes } from "node:crypto";

import { Prisma } from "../../../generated/prisma/client";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignUpInput,
} from "@/lib/validations/auth.schema";
import type { SignUpResponse } from "@/types/auth";

const FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const FORGOT_PASSWORD_RATE_LIMIT_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for this email, password reset instructions will be sent.";
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

type ForgotPasswordRateLimitEntry = {
  attempts: number;
  resetAt: number;
};

const forgotPasswordRateLimits = new Map<string, ForgotPasswordRateLimitEntry>();

function isForgotPasswordRateLimited(key: string): boolean {
  const now = Date.now();
  const existingEntry = forgotPasswordRateLimits.get(key);

  if (!existingEntry || existingEntry.resetAt <= now) {
    forgotPasswordRateLimits.set(key, {
      attempts: 1,
      resetAt: now + FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existingEntry.attempts >= FORGOT_PASSWORD_RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }

  forgotPasswordRateLimits.set(key, {
    ...existingEntry,
    attempts: existingEntry.attempts + 1,
  });
  return false;
}

function createPasswordResetToken(): string {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
}

function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetUrl(baseUrl: string, token: string): string {
  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export async function createUserWithPassword(
  input: SignUpInput,
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

    return {
      ok: true,
      user,
    };
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
  rateLimitKey: string,
  baseUrl?: string,
): Promise<RequestPasswordResetResult> {
  const email = normalizeEmail(input.email);
  const normalizedRateLimitKey = rateLimitKey.trim() || "unknown";
  const rateLimitBucket = `${normalizedRateLimitKey}:${email}`;

  if (isForgotPasswordRateLimited(rateLimitBucket)) {
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

  if (process.env.NODE_ENV !== "production" && baseUrl) {
    const devResetUrl = buildResetUrl(baseUrl, rawToken);
    console.info("Development password reset URL", devResetUrl);

    return {
      ...result,
      devResetUrl,
    };
  }

  // TODO: Send a reset email containing the raw token URL when an email
  // provider is configured. Never log or return reset URLs in production.
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
