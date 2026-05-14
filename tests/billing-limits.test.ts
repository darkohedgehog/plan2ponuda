import assert from "node:assert/strict";
import test from "node:test";

import {
  BILLING_PLAN_LIMITS,
  canUsePlanFeature,
  getUsageCounterTypeForFeature,
} from "../src/server/services/billing-limits";

test("defines requested local plan limits", () => {
  assert.deepEqual(BILLING_PLAN_LIMITS.free, {
    floorPlans: 1,
    largePdfAnalyses: 0,
    quotes: 1,
  });
  assert.deepEqual(BILLING_PLAN_LIMITS.basic, {
    floorPlans: 10,
    largePdfAnalyses: 0,
    quotes: 10,
  });
  assert.deepEqual(BILLING_PLAN_LIMITS.pro, {
    floorPlans: 20,
    largePdfAnalyses: 3,
    quotes: 20,
  });
});

test("allows feature use only while usage is below the plan limit", () => {
  assert.equal(
    canUsePlanFeature({ feature: "floorPlans", plan: "free", usage: 0 }),
    true,
  );
  assert.equal(
    canUsePlanFeature({ feature: "floorPlans", plan: "free", usage: 1 }),
    false,
  );
  assert.equal(
    canUsePlanFeature({ feature: "largePdfAnalyses", plan: "basic", usage: 0 }),
    false,
  );
});

test("maps feature gates to usage counter types", () => {
  assert.equal(
    getUsageCounterTypeForFeature("floorPlans"),
    "floor_plans_created",
  );
  assert.equal(getUsageCounterTypeForFeature("quotes"), "quotes_created");
  assert.equal(
    getUsageCounterTypeForFeature("largePdfAnalyses"),
    "large_pdf_analyses_used",
  );
});
