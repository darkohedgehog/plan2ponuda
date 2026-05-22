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
  assert.match(source, /canUseFeature/);
  assert.match(source, /largePdfAnalyses/);
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

test("document analysis service consumes usage only after successful AI analysis", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  const consumeIndex = source.indexOf("consumeUsageOrThrow");
  const successPersistIndex = source.indexOf("persistSuccessfulProjectDocumentAnalysis");
  const failedIndex = source.indexOf("markProjectDocumentAnalysisFailed");

  assert.notEqual(consumeIndex, -1);
  assert.notEqual(successPersistIndex, -1);
  assert.notEqual(failedIndex, -1);
  assert.ok(consumeIndex > successPersistIndex);
  assert.doesNotMatch(
    source.slice(failedIndex, failedIndex + 900),
    /consumeUsageOrThrow/,
  );
});

test("document analysis service does not change quote or material data", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  assert.doesNotMatch(source, /\.quote\./);
  assert.doesNotMatch(source, /\.projectMaterial\./);
  assert.doesNotMatch(source, /\.material\./);
});
