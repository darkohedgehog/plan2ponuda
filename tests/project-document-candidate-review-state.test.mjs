import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCandidateReviewSavePayload,
  filterCandidateReviewCandidates,
  getCandidateReviewCounters,
  getImportableAcceptedMaterialCount,
  getNextBulkCandidateStatusState,
} from "../src/components/projects/project-document-candidate-review-state.ts";

function createCandidate(overrides) {
  return {
    category: overrides.type === "labor" ? "labor" : "cable",
    confidence: "0.8",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    description: null,
    id: overrides.id,
    importedAt: null,
    importedLaborItemId: null,
    importedProjectMaterialId: null,
    name: overrides.name ?? overrides.id,
    notes: null,
    projectDocumentAnalysisId: "analysis_1",
    quantity: "1",
    sortOrder: 0,
    sourceReference: "E-01",
    status: overrides.status ?? "pending",
    totalPrice: null,
    type: overrides.type,
    unit: overrides.type === "labor" ? "hour" : "pcs",
    unitPrice: "10",
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

const candidates = [
  createCandidate({ id: "material_pending", type: "material" }),
  createCandidate({
    id: "material_accepted",
    status: "accepted",
    type: "material",
  }),
  createCandidate({
    id: "material_imported",
    importedAt: new Date("2026-01-02T00:00:00Z"),
    importedProjectMaterialId: "pm_1",
    status: "accepted",
    type: "material",
  }),
  createCandidate({ id: "labor_rejected", status: "rejected", type: "labor" }),
];

test("candidate review counters include type, status, and imported totals", () => {
  assert.deepEqual(getCandidateReviewCounters(candidates), {
    accepted: 2,
    imported: 1,
    importableMaterials: 1,
    labor: 1,
    material: 3,
    pending: 1,
    rejected: 1,
    total: 4,
  });
});

test("candidate review filters map type and status without mutating candidates", () => {
  assert.deepEqual(
    filterCandidateReviewCandidates(candidates, {
      status: "accepted",
      type: "material",
    }).map((candidate) => candidate.id),
    ["material_accepted", "material_imported"],
  );
  assert.deepEqual(
    filterCandidateReviewCandidates(candidates, {
      status: "imported",
      type: "all",
    }).map((candidate) => candidate.id),
    ["material_imported"],
  );
});

test("bulk status actions skip imported candidates", () => {
  const result = getNextBulkCandidateStatusState(candidates, {
    status: "rejected",
    type: "material",
  });

  assert.deepEqual([...result.changedIds], [
    "material_pending",
    "material_accepted",
  ]);
  assert.equal(
    result.candidates.find((candidate) => candidate.id === "material_imported")
      ?.status,
    "accepted",
  );

  const importedByQuoteLineResult = getNextBulkCandidateStatusState(
    [
      createCandidate({
        id: "material_imported_by_quote_line",
        importedProjectMaterialId: "pm_2",
        status: "accepted",
        type: "material",
      }),
    ],
    {
      status: "rejected",
      type: "material",
    },
  );

  assert.equal(importedByQuoteLineResult.changedIds.size, 0);
  assert.equal(importedByQuoteLineResult.candidates[0]?.status, "accepted");
});

test("dirty save payload sends only changed candidates and preserves validation fields", () => {
  const result = buildCandidateReviewSavePayload(
    candidates,
    new Set(["material_accepted"]),
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok ? result.candidates.map((candidate) => candidate.id) : [], [
    "material_accepted",
  ]);
  assert.equal(result.ok ? result.candidates[0]?.sourceReference : undefined, undefined);
  assert.equal(result.ok ? result.candidates[0]?.confidence : undefined, undefined);
});

test("import button is enabled only for accepted not-imported material candidates", () => {
  assert.equal(getImportableAcceptedMaterialCount(candidates), 1);
  assert.equal(
    getImportableAcceptedMaterialCount([
      createCandidate({
        id: "imported_only",
        importedAt: new Date("2026-01-02T00:00:00Z"),
        status: "accepted",
        type: "material",
      }),
      createCandidate({ id: "labor_accepted", status: "accepted", type: "labor" }),
    ]),
    0,
  );
});
