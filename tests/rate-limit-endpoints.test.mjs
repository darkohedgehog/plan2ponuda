import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Prisma schema defines DB-backed rate limit buckets", () => {
  const source = readSource("prisma/schema.prisma");

  assert.match(source, /model RateLimitBucket \{/);
  assert.match(source, /key\s+String/);
  assert.match(source, /scope\s+String/);
  assert.match(source, /windowStart\s+DateTime/);
  assert.match(source, /count\s+Int\s+@default\(0\)/);
  assert.match(source, /expiresAt\s+DateTime/);
  assert.match(source, /@@unique\(\[key, scope, windowStart\]\)/);
  assert.match(source, /@@index\(\[expiresAt\]\)/);
});

test("rate limiter is DB-backed and does not keep in-memory buckets", () => {
  const serviceSource = readSource("src/server/services/rate-limit-service.ts");
  const aiSource = readSource("src/lib/ai/rate-limit.ts");
  const authSource = readSource("src/server/services/auth-service.ts");

  assert.match(serviceSource, /INSERT INTO "RateLimitBucket"/);
  assert.match(serviceSource, /ON CONFLICT \("key", "scope", "windowStart"\)/);
  assert.match(serviceSource, /WHERE "RateLimitBucket"\."count" < /);
  assert.doesNotMatch(serviceSource, /new Map/);
  assert.doesNotMatch(aiSource, /new Map/);
  assert.doesNotMatch(authSource, /forgotPasswordRateLimits|new Map/);
});

test("AI analysis endpoint uses authenticated user ID for DB rate limiting", () => {
  const source = readSource("src/app/api/analysis/[projectId]/route.ts");

  assert.match(source, /checkRateLimitOrThrow/);
  assert.match(source, /scope:\s*RATE_LIMIT_SCOPES\.aiAnalysis/);
  assert.match(
    source,
    /key:\s*createAiRateLimitKey\(\{\s*userId:\s*auth\.user\.id/s,
  );
  assert.match(source, /getRateLimitHeaders/);
});

test("forgot-password keeps neutral response behavior and hashes identifiers", () => {
  const routeSource = readSource("src/app/api/auth/forgot-password/route.ts");
  const serviceSource = readSource("src/server/services/auth-service.ts");

  assert.match(routeSource, /safeSuccessMessage/);
  assert.match(routeSource, /rate_limited/);
  assert.match(serviceSource, /RATE_LIMIT_SCOPES\.forgotPassword/);
  assert.match(serviceSource, /createCompositeRateLimitKey/);
  assert.doesNotMatch(serviceSource, /rateLimitBucket\s*=\s*`\$\{.*email/s);
});

test("sign-in and sign-up endpoints are rate limited", () => {
  const nextAuthRouteSource = readSource("src/app/api/auth/[...nextauth]/route.ts");
  const signUpRouteSource = readSource("src/app/api/auth/sign-up/route.ts");

  assert.match(nextAuthRouteSource, /RATE_LIMIT_SCOPES\.signIn/);
  assert.match(nextAuthRouteSource, /checkRateLimitOrThrow/);
  assert.match(nextAuthRouteSource, /status:\s*429/);
  assert.match(signUpRouteSource, /RATE_LIMIT_SCOPES\.signUp/);
  assert.match(signUpRouteSource, /checkRateLimitOrThrow/);
  assert.match(signUpRouteSource, /status:\s*429/);
});

test("candidate review/import and billing session endpoints have scoped DB policies", () => {
  const serviceSource = readSource("src/server/services/rate-limit-service.ts");

  const expectedPolicies = [
    {
      limit: 30,
      scope: "projectDocumentCandidateReview",
      windowPattern: /windowSeconds:\s*5 \* 60/,
    },
    {
      limit: 10,
      scope: "projectDocumentCandidateImport",
      windowPattern: /windowSeconds:\s*10 \* 60/,
    },
    {
      limit: 5,
      scope: "billingCheckout",
      windowPattern: /windowSeconds:\s*10 \* 60/,
    },
    {
      limit: 10,
      scope: "billingPortal",
      windowPattern: /windowSeconds:\s*10 \* 60/,
    },
  ];

  for (const policy of expectedPolicies) {
    assert.match(serviceSource, new RegExp(`${policy.scope}:\\s*"`));
    assert.match(
      serviceSource,
      new RegExp(`${policy.scope}:\\s*\\{[\\s\\S]*?limit:\\s*${policy.limit}`),
    );
    assert.match(serviceSource, policy.windowPattern);
  }
});
