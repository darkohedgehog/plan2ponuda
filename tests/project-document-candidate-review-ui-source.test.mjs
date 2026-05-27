import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("candidate review UI has filters, counters, bulk actions, and sticky action bar", () => {
  const source = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );

  assert.match(source, /typeFilter/);
  assert.match(source, /statusFilter/);
  assert.match(source, /getCandidateReviewCounters/);
  assert.match(source, /filterCandidateReviewCandidates/);
  assert.match(source, /applyBulkStatus/);
  assert.match(source, /resetVisibleToPending/);
  assert.match(source, /sticky bottom-0/);
  assert.match(source, /unsavedChanges/);
  assert.match(source, /noCandidatesMatchFilter/);
});

test("candidate review save sends dirty candidates instead of every candidate", () => {
  const source = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );

  assert.match(source, /dirtyCandidateIds/);
  assert.match(source, /buildCandidateReviewSavePayload/);
  assert.match(source, /dirtyCandidateIds\.size/);
  assert.doesNotMatch(source, /for \(const candidate of candidates\)/);
});

test("candidate review import stays explicit and waits for saved accepted materials", () => {
  const source = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );

  assert.match(source, /getImportableAcceptedMaterialCount/);
  assert.match(source, /hasUnsavedChanges/);
  assert.match(source, /acceptedMaterialsReadyToImport/);
  assert.match(source, /hasUnsavedChanges \|\|/);
});
