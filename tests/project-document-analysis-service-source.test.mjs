import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("document analysis service enforces project, document, Pro, and storage policy", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  assert.match(source, /export async function analyzeProjectDocument/);
  assert.match(source, /getEffectivePlan/);
  assert.match(source, /pro_plan_required/);
  assert.match(
    source,
    /createPendingProjectDocumentAnalysisWithUsageReservation/,
  );
  assert.match(source, /large_pdf_analyses_used/);
  assert.match(source, /project:\s*\{[\s\S]*userId/);
  assert.match(source, /projectId/);
  assert.match(source, /assertProjectOwnedStoragePath/);
  assert.match(source, /download\(/);
});

test("document analysis service handles duplicate completed analysis without usage consumption", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  assert.match(source, /completedAnalysis/);
  assert.match(source, /already_analyzed/);
  assert.match(source, /mapProjectDocumentAnalysis/);
});

test("document analysis service reserves usage before AI and refunds failed attempts", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  const consumeIndex = source.indexOf("consumeUsageOrThrow");
  const reserveCallIndex = source.indexOf(
    "await createPendingProjectDocumentAnalysisWithUsageReservation",
  );
  const providerIndex = source.indexOf(
    "const aiAnalysis = await runProjectDocumentAnalysis",
  );
  const refundIndex = source.indexOf("refundProjectDocumentAnalysisUsage");

  assert.notEqual(consumeIndex, -1);
  assert.notEqual(reserveCallIndex, -1);
  assert.notEqual(providerIndex, -1);
  assert.notEqual(refundIndex, -1);
  assert.ok(reserveCallIndex < providerIndex);
  assert.match(source, /refundUsageReservation/);
});

test("document analysis service does not change quote or material data", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  assert.doesNotMatch(source, /\.quote\./);
  assert.doesNotMatch(source, /\.projectMaterial\./);
  assert.doesNotMatch(source, /\.material\./);
});
