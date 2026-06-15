import { createHash, randomUUID } from "node:crypto";
import { isIP } from "node:net";

import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

export const RATE_LIMIT_SCOPES = {
  aiAnalysis: "ai_analysis",
  billingCheckout: "billing_checkout",
  billingPortal: "billing_portal",
  floorPlanUpload: "floor_plan_upload",
  forgotPassword: "forgot_password",
  forgotPasswordEmail: "forgot_password_email",
  forgotPasswordIp: "forgot_password_ip",
  projectCreate: "project_create",
  projectDocumentCandidateImport: "project_document_candidate_import",
  projectDocumentCandidateReview: "project_document_candidate_review",
  projectDocumentAnalysis: "project_document_analysis",
  projectDocumentDelete: "project_document_delete",
  projectDocumentUpload: "project_document_upload",
  quoteUpdate: "quote_update",
  resendEmailVerification: "resend_email_verification",
  resetPassword: "reset_password",
  signIn: "sign_in",
  signInEmail: "sign_in_email",
  signInEmailIp: "sign_in_email_ip",
  signInIp: "sign_in_ip",
  signUp: "sign_up",
} as const;

export const RATE_LIMIT_POLICIES = {
  aiAnalysis: {
    limit: 10,
    windowSeconds: 60,
  },
  billingCheckout: {
    limit: 5,
    windowSeconds: 10 * 60,
  },
  billingPortal: {
    limit: 10,
    windowSeconds: 10 * 60,
  },
  forgotPassword: {
    limit: 3,
    windowSeconds: 15 * 60,
  },
  forgotPasswordEmail: {
    limit: 5,
    windowSeconds: 60 * 60,
  },
  forgotPasswordIp: {
    limit: 10,
    windowSeconds: 15 * 60,
  },
  floorPlanUpload: {
    limit: 10,
    windowSeconds: 10 * 60,
  },
  projectCreate: {
    limit: 20,
    windowSeconds: 60 * 60,
  },
  projectDocumentCandidateImport: {
    limit: 10,
    windowSeconds: 10 * 60,
  },
  projectDocumentCandidateReview: {
    limit: 30,
    windowSeconds: 5 * 60,
  },
  projectDocumentAnalysis: {
    limit: 3,
    windowSeconds: 60 * 60,
  },
  projectDocumentDelete: {
    limit: 30,
    windowSeconds: 10 * 60,
  },
  projectDocumentUpload: {
    limit: 10,
    windowSeconds: 60 * 60,
  },
  quoteUpdate: {
    limit: 60,
    windowSeconds: 10 * 60,
  },
  resendEmailVerification: {
    limit: 3,
    windowSeconds: 15 * 60,
  },
  resetPassword: {
    limit: 10,
    windowSeconds: 15 * 60,
  },
  signIn: {
    limit: 10,
    windowSeconds: 10 * 60,
  },
  signInEmail: {
    limit: 10,
    windowSeconds: 15 * 60,
  },
  signInEmailIp: {
    limit: 10,
    windowSeconds: 10 * 60,
  },
  signInIp: {
    limit: 30,
    windowSeconds: 15 * 60,
  },
  signUp: {
    limit: 5,
    windowSeconds: 30 * 60,
  },
} as const;

export type RateLimitScope =
  (typeof RATE_LIMIT_SCOPES)[keyof typeof RATE_LIMIT_SCOPES];

export type RateLimitBucketRow = {
  count: number;
  expiresAt: Date;
  windowStart: Date;
};

export type RateLimitDatabaseClient = {
  $executeRaw(query: Prisma.Sql): Promise<number>;
  $queryRaw<Result>(query: Prisma.Sql): Promise<Result>;
};

export type RateLimitAllowedStatus = {
  limit: number;
  ok: true;
  remaining: number;
  resetAt: Date;
};

export type RateLimitExceededStatus = {
  limit: number;
  ok: false;
  remaining: 0;
  resetAt: Date;
  retryAfterSeconds: number;
};

export type RateLimitStatus =
  | RateLimitAllowedStatus
  | RateLimitExceededStatus;

export type RateLimitKeyPart = {
  kind: "email" | "ip";
  value: string;
};

export type RateLimitOptions = {
  client?: RateLimitDatabaseClient;
  key: string;
  limit: number;
  now?: Date;
  scope: RateLimitScope;
  windowSeconds: number;
};

export class RateLimitExceededError extends Error {
  readonly status: RateLimitExceededStatus;

  constructor(status: RateLimitExceededStatus) {
    super("Rate limit exceeded");
    this.name = "RateLimitExceededError";
    this.status = status;
  }
}

export function computeRateLimitWindowStart(
  now: Date,
  windowSeconds: number,
): Date {
  const windowMs = windowSeconds * 1000;

  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export function hashRateLimitKey(value: string): string {
  const normalizedValue = normalizeRateLimitKeyValue(value);
  const digest = createHash("sha256").update(normalizedValue).digest("hex");

  return `sha256:${digest}`;
}

export function createCompositeRateLimitKey(parts: RateLimitKeyPart[]): string {
  return parts
    .map((part) => `${part.kind}:${hashRateLimitKey(part.value)}`)
    .join("|");
}

export function createAiRateLimitKey(params: { userId: string }): string {
  return `user:${params.userId}`;
}

export function createUserRateLimitKey(params: { userId: string }): string {
  return `user:${params.userId}`;
}

export function getClientIpAddress(request: Request): string {
  const cloudflareIp = getValidIpHeader(request, "cf-connecting-ip");

  if (cloudflareIp) {
    return cloudflareIp;
  }

  const forwardedIp = getFirstValidForwardedIp(
    request.headers.get("x-forwarded-for"),
  );

  if (forwardedIp) {
    return forwardedIp;
  }

  return getValidIpHeader(request, "x-real-ip") ?? "unknown";
}

export async function checkRateLimitOrThrow(
  options: RateLimitOptions,
): Promise<RateLimitAllowedStatus> {
  validateRateLimitOptions(options);

  const client = options.client ?? prisma;
  const now = options.now ?? new Date();
  const windowStart = computeRateLimitWindowStart(now, options.windowSeconds);
  const resetAt = getWindowResetAt(windowStart, options.windowSeconds);
  const rows = await client.$queryRaw<RateLimitBucketRow[]>(Prisma.sql`
    INSERT INTO "RateLimitBucket"
      ("id", "key", "scope", "windowStart", "count", "expiresAt", "updatedAt")
    VALUES
      (${randomUUID()}, ${options.key}, ${options.scope}, ${windowStart}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key", "scope", "windowStart")
    DO UPDATE SET
      "count" = "RateLimitBucket"."count" + 1,
      "expiresAt" = EXCLUDED."expiresAt",
      "updatedAt" = ${now}
    WHERE "RateLimitBucket"."count" < ${options.limit}
    RETURNING "count", "windowStart", "expiresAt"
  `);
  const bucket = rows.at(0);

  if (bucket) {
    return createAllowedStatus(options.limit, bucket);
  }

  const existingStatus = await getRateLimitStatus({
    ...options,
    client,
    now,
  });
  const exceededStatus: RateLimitExceededStatus = {
    limit: options.limit,
    ok: false,
    remaining: 0,
    resetAt: existingStatus.resetAt,
    retryAfterSeconds: calculateRetryAfterSeconds(now, existingStatus.resetAt),
  };

  throw new RateLimitExceededError(exceededStatus);
}

export async function getRateLimitStatus(
  options: RateLimitOptions,
): Promise<RateLimitStatus> {
  validateRateLimitOptions(options);

  const client = options.client ?? prisma;
  const now = options.now ?? new Date();
  const windowStart = computeRateLimitWindowStart(now, options.windowSeconds);
  const defaultResetAt = getWindowResetAt(windowStart, options.windowSeconds);
  const rows = await client.$queryRaw<RateLimitBucketRow[]>(Prisma.sql`
    SELECT "count", "windowStart", "expiresAt"
    FROM "RateLimitBucket"
    WHERE "key" = ${options.key}
      AND "scope" = ${options.scope}
      AND "windowStart" = ${windowStart}
    LIMIT 1
  `);
  const bucket = rows.at(0);

  if (!bucket) {
    return {
      limit: options.limit,
      ok: true,
      remaining: options.limit,
      resetAt: defaultResetAt,
    };
  }

  if (bucket.count >= options.limit) {
    return {
      limit: options.limit,
      ok: false,
      remaining: 0,
      resetAt: bucket.expiresAt,
      retryAfterSeconds: calculateRetryAfterSeconds(now, bucket.expiresAt),
    };
  }

  return createAllowedStatus(options.limit, bucket);
}

export async function cleanupExpiredRateLimitBuckets(params?: {
  client?: RateLimitDatabaseClient;
  now?: Date;
}): Promise<number> {
  const client = params?.client ?? prisma;
  const now = params?.now ?? new Date();

  return client.$executeRaw(Prisma.sql`
    DELETE FROM "RateLimitBucket"
    WHERE "expiresAt" <= ${now}
  `);
}

export function getRateLimitHeaders(
  status: RateLimitStatus,
): Record<string, string> {
  const resetValue = Math.ceil(status.resetAt.getTime() / 1000).toString();
  const headers: Record<string, string> = {
    "RateLimit-Limit": status.limit.toString(),
    "RateLimit-Remaining": status.remaining.toString(),
    "RateLimit-Reset": resetValue,
    "X-RateLimit-Limit": status.limit.toString(),
    "X-RateLimit-Remaining": status.remaining.toString(),
    "X-RateLimit-Reset": resetValue,
  };

  if (!status.ok) {
    headers["Retry-After"] = status.retryAfterSeconds.toString();
  }

  return headers;
}

function normalizeRateLimitKeyValue(value: string): string {
  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue.length > 0 ? normalizedValue : "unknown";
}

function getValidIpHeader(request: Request, headerName: string): string | null {
  return normalizeIpAddress(request.headers.get(headerName));
}

function getFirstValidForwardedIp(value: string | null): string | null {
  return (
    value
      ?.split(",")
      .map((part) => normalizeIpAddress(part))
      .find((part): part is string => Boolean(part)) ?? null
  );
}

function normalizeIpAddress(value: string | null): string | null {
  const trimmedValue = value?.trim();

  if (!trimmedValue || isIP(trimmedValue) === 0) {
    return null;
  }

  return trimmedValue;
}

function validateRateLimitOptions(options: RateLimitOptions): void {
  if (options.limit < 1) {
    throw new Error("Rate limit must be at least 1.");
  }

  if (options.windowSeconds < 1) {
    throw new Error("Rate limit window must be at least 1 second.");
  }
}

function getWindowResetAt(windowStart: Date, windowSeconds: number): Date {
  return new Date(windowStart.getTime() + windowSeconds * 1000);
}

function createAllowedStatus(
  limit: number,
  bucket: RateLimitBucketRow,
): RateLimitAllowedStatus {
  return {
    limit,
    ok: true,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.expiresAt,
  };
}

function calculateRetryAfterSeconds(now: Date, resetAt: Date): number {
  return Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
}
