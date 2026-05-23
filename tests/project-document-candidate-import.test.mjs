import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DOCUMENT_AI_PROJECT_MATERIAL_SOURCE,
  buildImportedProjectMaterialCreateInput,
} from "../src/server/services/project-document-candidate-builders.ts";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("maps an accepted material candidate to a project-local manual material snapshot", () => {
  const input = buildImportedProjectMaterialCreateInput("project_1", {
    category: "cable",
    name: "NYM-J 3x1.5 cable",
    quantity: "120.5",
    unit: "m",
    unitPrice: "3.25",
  });

  assert.equal(input.projectId, "project_1");
  assert.equal(input.materialId, null);
  assert.equal(input.manualName, "NYM-J 3x1.5 cable");
  assert.equal(input.manualCategory, "cable");
  assert.equal(input.manualUnit, "m");
  assert.equal(String(input.quantity), "120.5");
  assert.equal(String(input.unitPrice), "3.25");
  assert.equal(String(input.totalPrice), "391.63");
  assert.equal(input.source, DOCUMENT_AI_PROJECT_MATERIAL_SOURCE);
});

test("falls back to safe material category, unit, and zero values for incomplete candidates", () => {
  const input = buildImportedProjectMaterialCreateInput("project_1", {
    category: "labor",
    name: "Unpriced material",
    quantity: null,
    unit: "hour",
    unitPrice: null,
  });

  assert.equal(input.materialId, null);
  assert.equal(input.manualCategory, "other");
  assert.equal(input.manualUnit, "pcs");
  assert.equal(String(input.quantity), "0");
  assert.equal(String(input.unitPrice), "0");
  assert.equal(String(input.totalPrice), "0");
  assert.equal(input.source, DOCUMENT_AI_PROJECT_MATERIAL_SOURCE);
});

test("Prisma schema tracks imported document candidates idempotently", () => {
  const schema = readSource("prisma/schema.prisma");

  assert.match(schema, /importedAt\s+DateTime\?/);
  assert.match(schema, /importedProjectMaterialId\s+String\?/);
  assert.match(schema, /importedLaborItemId\s+String\?/);
});

test("document candidate import service gates Pro users, imports only accepted materials, and skips labor", () => {
  const source = readSource(
    "src/server/services/project-document-candidate-import-service.ts",
  );

  assert.match(source, /export async function importAcceptedDocumentCandidatesToQuote/);
  assert.match(source, /getEffectivePlan/);
  assert.match(source, /plan !== "pro"/);
  assert.match(source, /status:\s*"accepted"/);
  assert.match(source, /importedAt:\s*null/);
  assert.match(source, /type:\s*"material"/);
  assert.match(source, /candidate\.type === "labor"/);
  assert.match(source, /\.projectMaterial\.create/);
  assert.match(source, /buildImportedProjectMaterialCreateInput/);
  assert.match(source, /importedProjectMaterialId/);
  assert.match(source, /importedLaborCount:\s*0/);
  assert.match(source, /laborSkippedCount/);
  assert.match(source, /recalculateQuoteFromPersistedMaterials/);
  assert.doesNotMatch(source, /\.material\.create/);
  assert.doesNotMatch(source, /\.material\.upsert/);
});

test("document candidate import route is authenticated and delegates to the service", () => {
  const source = readSource(
    "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/import/route.ts",
  );

  assert.match(source, /requireApiUser/);
  assert.match(source, /importAcceptedDocumentCandidatesToQuote/);
  assert.match(source, /export async function POST/);
  assert.doesNotMatch(source, /prisma\./);
  assert.doesNotMatch(source, /getOpenAiClient/);
});

test("candidate review UI imports only after explicit user action", () => {
  const source = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );

  assert.match(source, /importAcceptedItemsToQuote/);
  assert.match(source, /acceptedMaterialsReadyToImport/);
  assert.match(source, /acceptedLaborItemsNotImportedYet/);
  assert.match(source, /acceptedMaterialsAlreadyImported/);
  assert.match(source, /method:\s*"POST"/);
  assert.match(source, /\/import/);

  const saveReviewBody = source.slice(
    source.indexOf("async function saveReview"),
    source.indexOf("return ("),
  );

  assert.doesNotMatch(saveReviewBody, /\/import/);
  assert.doesNotMatch(saveReviewBody, /Import accepted/);
});
