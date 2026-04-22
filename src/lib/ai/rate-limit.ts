import "server-only";

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | {
      limit: number;
      ok: true;
      remaining: number;
      resetAt: Date;
    }
  | {
      limit: number;
      ok: false;
      remaining: 0;
      resetAt: Date;
      retryAfterSeconds: number;
    };

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export const AI_RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 1000,
} as const;

// Future AI route handlers must call this limiter after authentication and
// before invoking AI services. Swap the in-memory store for a shared store
// before running multiple production instances.
export function createAiRateLimitKey(params: {
  endpoint: string;
  userId: string;
}): string {
  return `ai:${params.endpoint}:user:${params.userId}`;
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existingBucket = buckets.get(options.key);
  const bucket =
    existingBucket && existingBucket.resetAt > now
      ? existingBucket
      : {
          count: 0,
          resetAt: now + options.windowMs,
        };

  bucket.count += 1;
  buckets.set(options.key, bucket);
  pruneExpiredBuckets(now);

  const resetAt = new Date(bucket.resetAt);

  if (bucket.count > options.limit) {
    return {
      limit: options.limit,
      ok: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      ),
    };
  }

  return {
    limit: options.limit,
    ok: true,
    remaining: options.limit - bucket.count,
    resetAt,
  };
}

export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": result.limit.toString(),
    "RateLimit-Remaining": result.remaining.toString(),
    "RateLimit-Reset": Math.ceil(result.resetAt.getTime() / 1000).toString(),
  };

  if (!result.ok) {
    headers["Retry-After"] = result.retryAfterSeconds.toString();
  }

  return headers;
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
