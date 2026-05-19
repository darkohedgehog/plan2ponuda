import assert from "node:assert/strict";
import test from "node:test";

import { getProjectDocumentationAnalysisState } from "../src/lib/billing/project-documentation-analysis.ts";

test("locks project documentation analysis for free and basic plans", () => {
  assert.deepEqual(getProjectDocumentationAnalysisState("free"), {
    isPro: false,
    state: "locked",
  });
  assert.deepEqual(getProjectDocumentationAnalysisState("basic"), {
    isPro: false,
    state: "locked",
  });
});

test("unlocks project documentation analysis placeholder for pro plan", () => {
  assert.deepEqual(getProjectDocumentationAnalysisState("pro"), {
    isPro: true,
    state: "coming_soon",
  });
});
