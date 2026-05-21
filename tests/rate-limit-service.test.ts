import assert from "node:assert/strict";
import test from "node:test";

import type { Prisma } from "../generated/prisma/client";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  computeRateLimitWindowStart,
  createAiRateLimitKey,
  createCompositeRateLimitKey,
  getRateLimitHeaders,
  hashRateLimitKey,
  type RateLimitBucketRow,
  type RateLimitDatabaseClient,
} from "../src/server/services/rate-limit-service";

function createFakeRateLimitClient(results: RateLimitBucketRow[][]) {
  const queries: Prisma.Sql[] = [];
  const client: RateLimitDatabaseClient = {
    async $executeRaw(query: Prisma.Sql) {
      queries.push(query);
      return 0;
    },
    async $queryRaw<Result>(query: Prisma.Sql) {
      queries.push(query);
      return (results.shift() ?? []) as Result;
    },
  };

  return {
    client,
    queries,
  };
}

test("computes fixed window bucket starts", () => {
  const now = new Date("2026-05-21T10:07:34.567Z");

  assert.equal(
    computeRateLimitWindowStart(now, 60).toISOString(),
    "2026-05-21T10:07:00.000Z",
  );
  assert.equal(
    computeRateLimitWindowStart(now, 15 * 60).toISOString(),
    "2026-05-21T10:00:00.000Z",
  );
});

test("allows requests below the limit with remaining and reset metadata", async () => {
  const now = new Date("2026-05-21T10:07:34.567Z");
  const windowStart = new Date("2026-05-21T10:07:00.000Z");
  const expiresAt = new Date("2026-05-21T10:08:00.000Z");
  const { client } = createFakeRateLimitClient([
    [
      {
        count: 2,
        expiresAt,
        windowStart,
      },
    ],
  ]);

  const status = await checkRateLimitOrThrow({
    client,
    key: "user:user_123",
    limit: 3,
    now,
    scope: RATE_LIMIT_SCOPES.aiAnalysis,
    windowSeconds: 60,
  });

  assert.deepEqual(status, {
    limit: 3,
    ok: true,
    remaining: 1,
    resetAt: expiresAt,
  });
});

test("blocks requests at the limit without incrementing the bucket", async () => {
  const now = new Date("2026-05-21T10:07:30.000Z");
  const windowStart = new Date("2026-05-21T10:07:00.000Z");
  const expiresAt = new Date("2026-05-21T10:08:00.000Z");
  const { client } = createFakeRateLimitClient([
    [],
    [
      {
        count: 3,
        expiresAt,
        windowStart,
      },
    ],
  ]);

  await assert.rejects(
    () =>
      checkRateLimitOrThrow({
        client,
        key: "user:user_123",
        limit: 3,
        now,
        scope: RATE_LIMIT_SCOPES.aiAnalysis,
        windowSeconds: 60,
      }),
    (error: unknown) => {
      assert.ok(error instanceof RateLimitExceededError);
      assert.deepEqual(error.status, {
        limit: 3,
        ok: false,
        remaining: 0,
        resetAt: expiresAt,
        retryAfterSeconds: 30,
      });
      return true;
    },
  );
});

test("returns safe rate limit headers", () => {
  const headers = getRateLimitHeaders({
    limit: 10,
    ok: false,
    remaining: 0,
    resetAt: new Date("2026-05-21T10:08:00.000Z"),
    retryAfterSeconds: 25,
  });

  assert.equal(headers["Retry-After"], "25");
  assert.equal(headers["RateLimit-Limit"], "10");
  assert.equal(headers["RateLimit-Remaining"], "0");
  assert.equal(headers["RateLimit-Reset"], "1779358080");
  assert.equal(headers["X-RateLimit-Limit"], "10");
  assert.equal(headers["X-RateLimit-Remaining"], "0");
  assert.equal(headers["X-RateLimit-Reset"], "1779358080");
});

test("hashes sensitive rate limit key material", () => {
  const email = "User.Name+test@example.com";
  const ipAddress = "203.0.113.42";
  const key = createCompositeRateLimitKey([
    {
      kind: "email",
      value: email,
    },
    {
      kind: "ip",
      value: ipAddress,
    },
  ]);

  assert.match(hashRateLimitKey(email), /^sha256:[a-f0-9]{64}$/);
  assert.doesNotMatch(key, /User\.Name/i);
  assert.doesNotMatch(key, /example\.com/i);
  assert.doesNotMatch(key, /203\.0\.113\.42/);
  assert.match(key, /^email:sha256:[a-f0-9]{64}\|ip:sha256:[a-f0-9]{64}$/);
});

test("defines the AI policy and user-scoped AI key", () => {
  assert.equal(RATE_LIMIT_SCOPES.aiAnalysis, "ai_analysis");
  assert.equal(RATE_LIMIT_POLICIES.aiAnalysis.limit, 10);
  assert.equal(RATE_LIMIT_POLICIES.aiAnalysis.windowSeconds, 60);
  assert.equal(createAiRateLimitKey({ userId: "user_123" }), "user:user_123");
});
