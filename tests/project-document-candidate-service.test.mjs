import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProjectDocumentCandidateCreateInputs,
  calculateCandidateTotalPrice,
} from "../src/server/services/project-document-candidate-builders.ts";

const parsedResponse = {
  assumptions: ["Lengths are estimated only where labelled."],
  detectedSystems: ["lighting", "sockets"],
  laborCandidates: [
    {
      confidence: 0.61,
      description: "Install visible lighting points.",
      name: "Lighting installation",
      notes: "Fixture schedule is incomplete.",
      quantity: 6,
      sourceReference: "Section E-2",
      unit: "hour",
    },
  ],
  materialCandidates: [
    {
      category: "cable",
      confidence: 0.82,
      name: "NYM-J 3x1.5 cable",
      notes: "Length shown in cable schedule.",
      quantity: 120.5,
      sourceReference: "Table 4",
      unit: "m",
    },
    {
      category: "socket",
      confidence: 0.74,
      name: "Schuko socket",
      notes: null,
      quantity: null,
      sourceReference: "Drawing E-01",
      unit: "pcs",
    },
  ],
  missingInformation: ["Distribution board type"],
  overallConfidence: 0.7,
  projectSummary: "Apartment electrical documentation.",
};

test("builds material and labor candidate rows from parsed analysis output", () => {
  const rows = buildProjectDocumentCandidateCreateInputs(
    "analysis_1",
    parsedResponse,
  );

  assert.equal(rows.length, 3);

  const [firstMaterial, secondMaterial, labor] = rows;

  assert.equal(firstMaterial.projectDocumentAnalysisId, "analysis_1");
  assert.equal(firstMaterial.type, "material");
  assert.equal(firstMaterial.status, "pending");
  assert.equal(firstMaterial.name, "NYM-J 3x1.5 cable");
  assert.equal(firstMaterial.category, "cable");
  assert.equal(firstMaterial.unit, "m");
  assert.equal(String(firstMaterial.quantity), "120.5");
  assert.equal(firstMaterial.unitPrice, null);
  assert.equal(firstMaterial.totalPrice, null);
  assert.equal(firstMaterial.sourceReference, "Table 4");
  assert.equal(String(firstMaterial.confidence), "0.82");
  assert.equal(firstMaterial.sortOrder, 0);
  assert.deepEqual(firstMaterial.originalJson, parsedResponse.materialCandidates[0]);

  assert.equal(secondMaterial.sortOrder, 1);
  assert.equal(secondMaterial.quantity, null);

  assert.equal(labor.type, "labor");
  assert.equal(labor.name, "Lighting installation");
  assert.equal(labor.description, "Install visible lighting points.");
  assert.equal(labor.category, "labor");
  assert.equal(labor.unit, "hour");
  assert.equal(String(labor.quantity), "6");
  assert.equal(labor.sourceReference, "Section E-2");
  assert.equal(labor.sortOrder, 0);
  assert.deepEqual(labor.originalJson, parsedResponse.laborCandidates[0]);
});

test("calculates candidate total price server-side only when quantity and unit price exist", () => {
  assert.equal(calculateCandidateTotalPrice(null, 12), null);
  assert.equal(calculateCandidateTotalPrice(2, null), null);
  assert.equal(String(calculateCandidateTotalPrice(3, 12.345)), "37.04");
});
