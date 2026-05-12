import assert from "node:assert/strict";
import test from "node:test";

import {
  getAnalyzeFloorPlanUiState,
  type AnalysisFeedback,
} from "../src/components/analysis/analyze-floor-plan-state";

test("shows only existing rooms feedback when refreshed props report rooms", () => {
  const staleSuccess: AnalysisFeedback = {
    kind: "success",
    roomCount: 5,
  };

  const state = getAnalyzeFloorPlanUiState({
    feedback: staleSuccess,
    hasExistingRooms: true,
    hasFloorPlan: true,
    isSubmitting: false,
  });

  assert.equal(state.button.visible, false);
  assert.deepEqual(state.feedback, { kind: "existingRooms" });
});

test("allows analysis when a floor plan exists and the project has no rooms", () => {
  const state = getAnalyzeFloorPlanUiState({
    feedback: null,
    hasExistingRooms: false,
    hasFloorPlan: true,
    isSubmitting: false,
  });

  assert.deepEqual(state.button, {
    disabled: false,
    labelKey: "analyzeFloorPlan",
    visible: true,
  });
  assert.equal(state.feedback, null);
});

test("shows the current success feedback only before rooms exist in props", () => {
  const state = getAnalyzeFloorPlanUiState({
    feedback: {
      kind: "success",
      roomCount: 5,
    },
    hasExistingRooms: false,
    hasFloorPlan: true,
    isSubmitting: false,
  });

  assert.deepEqual(state.feedback, {
    kind: "success",
    roomCount: 5,
  });
});
