import assert from "node:assert/strict";
import test from "node:test";

import {
  projectDocumentAnalysisOutputSchema,
} from "../src/lib/validations/project-document-analysis.schema.ts";

const validOutput = {
  assumptions: ["Quantities without callouts are left unresolved."],
  detectedSystems: ["lighting", "sockets"],
  laborCandidates: [
    {
      confidence: 0.62,
      description: "Install visible lighting circuits.",
      name: "Lighting installation",
      notes: null,
      quantity: null,
      sourceReference: "Page 2",
      unit: "item",
    },
  ],
  materialCandidates: [
    {
      category: "cable",
      confidence: 0.8,
      name: "NYM cable",
      notes: "Length is not explicitly specified.",
      quantity: null,
      sourceReference: "E-01",
      unit: "m",
    },
  ],
  missingInformation: ["Distribution board schedule"],
  overallConfidence: 0.74,
  projectSummary: "Electrical documentation for an apartment renovation.",
};

test("accepts valid structured project document analysis output", () => {
  const parsed = projectDocumentAnalysisOutputSchema.parse(validOutput);

  assert.equal(parsed.materialCandidates.length, 1);
  assert.equal(parsed.laborCandidates.length, 1);
});

test("rejects invalid confidence values", () => {
  const result = projectDocumentAnalysisOutputSchema.safeParse({
    ...validOutput,
    overallConfidence: 1.2,
  });

  assert.equal(result.success, false);
});

test("rejects invalid material categories", () => {
  const result = projectDocumentAnalysisOutputSchema.safeParse({
    ...validOutput,
    materialCandidates: [
      {
        ...validOutput.materialCandidates[0],
        category: "paint",
      },
    ],
  });

  assert.equal(result.success, false);
});
