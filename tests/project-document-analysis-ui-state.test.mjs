import assert from "node:assert/strict";
import test from "node:test";

import { getProjectDocumentAnalysisUiState } from "../src/lib/billing/project-document-analysis-view.ts";

test("maps document statuses to analysis UI states", () => {
  assert.deepEqual(getProjectDocumentAnalysisUiState("uploaded"), {
    canAnalyze: true,
    showSummary: false,
    state: "ready",
  });
  assert.deepEqual(getProjectDocumentAnalysisUiState("failed"), {
    canAnalyze: true,
    showSummary: false,
    state: "failed",
  });
  assert.deepEqual(getProjectDocumentAnalysisUiState("analyzing"), {
    canAnalyze: false,
    showSummary: false,
    state: "analyzing",
  });
  assert.deepEqual(getProjectDocumentAnalysisUiState("analyzed"), {
    canAnalyze: false,
    showSummary: true,
    state: "analyzed",
  });
});
