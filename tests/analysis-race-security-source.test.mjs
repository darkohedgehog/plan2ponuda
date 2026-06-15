import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("floor plan analysis atomically claims a project before calling OpenAI", () => {
  const source = readSource("src/server/services/analysis-service.ts");
  const claimIndex = source.indexOf("claimProjectForAnalysis");
  const openAiIndex = source.indexOf(
    "const aiAnalysis = await runFloorPlanAnalysis",
  );

  assert.ok(claimIndex > -1);
  assert.ok(openAiIndex > -1);
  assert.ok(claimIndex < openAiIndex);
  assert.match(source, /project\.updateMany/);
  assert.match(source, /status:\s*\{\s*not:\s*"analyzing",?\s*\}/);
  assert.match(source, /rooms:\s*\{\s*none:\s*\{\},?\s*\}/);
  assert.match(source, /sourceFilePath:\s*\{\s*not:\s*null,?\s*\}/);
  assert.match(source, /analysis_in_progress/);
});

test("floor plan analysis route returns a safe 409 while analysis is in progress", () => {
  const route = readSource("src/app/api/analysis/[projectId]/route.ts");
  const types = readSource("src/types/analysis.ts");

  assert.match(types, /"analysis_in_progress"/);
  assert.match(route, /case "analysis_in_progress":/);
  assert.match(
    route,
    /case "analysis_in_progress":[\s\S]*?return reason;/,
  );
  assert.match(route, /This floor plan is already being analyzed\./);
  assert.match(
    route,
    /case "analysis_in_progress":[\s\S]*?return 409;/,
  );
});

test("document analysis reserves usage before OpenAI and refunds on failures", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );
  const reserveIndex = source.indexOf(
    "createPendingProjectDocumentAnalysisWithUsageReservation",
  );
  const openAiIndex = source.indexOf(
    "const aiAnalysis = await runProjectDocumentAnalysis",
  );
  const persistIndex = source.indexOf("persistSuccessfulProjectDocumentAnalysis");

  assert.ok(reserveIndex > -1);
  assert.ok(openAiIndex > -1);
  assert.ok(persistIndex > -1);
  assert.ok(reserveIndex < openAiIndex);
  assert.doesNotMatch(source, /canUseFeature\(userId,\s*"largePdfAnalyses"\)/);
  assert.match(source, /consumeUsageOrThrow/);
  assert.match(source, /"large_pdf_analyses_used"/);
  assert.match(source, /refundProjectDocumentAnalysisUsage/);
  assert.match(source, /refundUsageReservation/);
});

test("document analysis duplicate handling still avoids duplicate OpenAI calls", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  assert.match(source, /completedAnalysis/);
  assert.match(source, /already_analyzed/);
  assert.match(source, /status:\s*"analyzing"/);
  assert.match(source, /reason:\s*"analysis_in_progress"/);
});

test("billing service exposes an atomic usage reservation refund helper", () => {
  const source = readSource("src/server/services/billing-service.ts");

  assert.match(source, /export async function refundUsageReservation/);
  assert.match(source, /usageCounter\.updateMany/);
  assert.match(source, /decrement:\s*1/);
  assert.match(source, /count:\s*\{\s*gt:\s*0,?\s*\}/);
});
