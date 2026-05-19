import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldCountFloorPlanUpload,
  shouldCountQuoteCreation,
} from "../src/server/services/usage-limit-policy.ts";

test("counts only the first successful floor plan upload for a project", () => {
  assert.equal(shouldCountFloorPlanUpload(null), true);
  assert.equal(shouldCountFloorPlanUpload("projects/project-1/floor-plan.pdf"), false);
});

test("counts only the first persisted quote for a project", () => {
  assert.equal(shouldCountQuoteCreation(null), true);
  assert.equal(shouldCountQuoteCreation("quote_1"), false);
});
