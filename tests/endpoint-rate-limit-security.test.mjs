import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("project, upload, document, candidate, billing, and quote mutation endpoints are rate limited", () => {
  const checks = [
    {
      path: "src/app/api/projects/route.ts",
      scope: "projectCreate",
    },
    {
      path: "src/app/api/projects/[projectId]/upload/route.ts",
      scope: "floorPlanUpload",
    },
    {
      path: "src/app/api/projects/[projectId]/documents/upload/route.ts",
      scope: "projectDocumentUpload",
    },
    {
      path: "src/app/api/projects/[projectId]/documents/[documentId]/route.ts",
      scope: "projectDocumentDelete",
    },
    {
      path: "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/candidates/route.ts",
      scope: "projectDocumentCandidateReview",
    },
    {
      path: "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/import/route.ts",
      scope: "projectDocumentCandidateImport",
    },
    {
      path: "src/app/api/billing/checkout/route.ts",
      scope: "billingCheckout",
    },
    {
      path: "src/app/api/billing/portal/route.ts",
      scope: "billingPortal",
    },
    {
      path: "src/app/api/quotes/[projectId]/route.ts",
      scope: "quoteUpdate",
    },
  ];

  for (const check of checks) {
    const source = readSource(check.path);

    assert.match(source, /checkRateLimitOrThrow/);
    assert.match(source, new RegExp(`RATE_LIMIT_SCOPES\\.${check.scope}`));
    assert.match(source, /createUserRateLimitKey/);
    assert.match(source, /getRateLimitHeaders/);
    assert.match(source, /status:\s*429/);
  }
});

test("rate limit service defines policies for non-AI mutation endpoints", () => {
  const source = readSource("src/server/services/rate-limit-service.ts");

  for (const scope of [
    "floorPlanUpload",
    "projectCreate",
    "projectDocumentDelete",
    "projectDocumentUpload",
    "quoteUpdate",
  ]) {
    assert.match(source, new RegExp(`${scope}:\\s*"`));
    assert.match(source, new RegExp(`${scope}:\\s*\\{[\\s\\S]*?limit:`));
  }

  assert.match(source, /createUserRateLimitKey/);
});

test("candidate and billing rate limits run before expensive mutations", () => {
  const checks = [
    {
      call: "saveDocumentCandidateReview(",
      path: "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/candidates/route.ts",
    },
    {
      call: "importAcceptedDocumentCandidatesToQuote(",
      path: "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/import/route.ts",
    },
    {
      call: "createBillingCheckoutSession({",
      path: "src/app/api/billing/checkout/route.ts",
    },
    {
      call: "createBillingPortalSession({",
      path: "src/app/api/billing/portal/route.ts",
    },
  ];

  for (const check of checks) {
    const source = readSource(check.path);
    const rateLimitIndex = source.lastIndexOf("checkRateLimitOrThrow");
    const mutationIndex = source.lastIndexOf(check.call);

    assert.ok(rateLimitIndex > -1, `missing rate limit in ${check.path}`);
    assert.ok(mutationIndex > -1, `missing mutation call in ${check.path}`);
    assert.ok(
      rateLimitIndex < mutationIndex,
      `expected rate limit before ${check.call} in ${check.path}`,
    );
  }
});
