import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function getFunctionBody(source, functionName) {
  const start = source.indexOf(`export async function ${functionName}`);
  assert.notEqual(start, -1, `${functionName} not found`);

  const nextExport = source.indexOf("\nexport async function", start + 1);

  return source.slice(start, nextExport === -1 ? undefined : nextExport);
}

test("candidate review client sends only dirty editable candidates", () => {
  const componentSource = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );
  const stateSource = readSource(
    "src/components/projects/project-document-candidate-review-state.ts",
  );

  assert.match(componentSource, /dirtyCandidateIds/);
  assert.match(
    componentSource,
    /buildCandidateReviewSavePayload\(\s*candidates,\s*dirtyCandidateIds,\s*\)/,
  );
  assert.match(componentSource, /dirtyCandidateIds\.size === 0/);
  assert.match(stateSource, /!dirtyCandidateIds\.has\(candidate\.id\)/);
  assert.match(stateSource, /isImportedCandidate\(candidate\)/);
  assert.doesNotMatch(stateSource, /sourceReference/);
  assert.doesNotMatch(stateSource, /confidence/);
});

test("bulk candidate actions mark changed candidates dirty", () => {
  const componentSource = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );

  assert.match(componentSource, /getNextBulkCandidateStatusState/);
  assert.match(componentSource, /result\.changedIds/);
  assert.match(componentSource, /addDirtyIds\(currentIds, result\.changedIds\)/);
});

test("candidate review save avoids stale transaction-client reads", () => {
  const source = readSource(
    "src/server/services/project-document-candidate-service.ts",
  );
  const body = getFunctionBody(source, "saveDocumentCandidateReview");

  assert.doesNotMatch(body, /ensureCandidatesForAnalysis\(analysis\.id,\s*transaction\)/);
  assert.doesNotMatch(body, /getCandidatesForAnalysis\(analysis\.id,\s*transaction\)/);
  assert.match(body, /await ensureCandidatesForAnalysis\(analysis\.id\)/);
  assert.match(body, /candidates:\s*await getCandidatesForAnalysis\(analysis\.id\)/);
});

test("candidate review save validates submitted candidate ownership and locked state", () => {
  const source = readSource(
    "src/server/services/project-document-candidate-service.ts",
  );
  const body = getFunctionBody(source, "saveDocumentCandidateReview");

  assert.match(body, /projectDocumentAnalysisId:\s*analysis\.id/);
  assert.match(body, /id:\s*\{\s*in:\s*candidateIds,?\s*\}/);
  assert.match(body, /importedAt/);
  assert.match(body, /importedProjectMaterialId/);
  assert.match(body, /importedLaborItemId/);
  assert.match(body, /isPersistedCandidateLocked/);
});

test("candidate review save still calculates totals server-side", () => {
  const source = readSource(
    "src/server/services/project-document-candidate-service.ts",
  );
  const body = getFunctionBody(source, "saveDocumentCandidateReview");

  assert.match(body, /calculateCandidateTotalPrice\(quantity,\s*unitPrice\)/);
  assert.match(body, /toNullableDecimal\(quantity\)/);
  assert.match(body, /toMoneyDecimal\(unitPrice\)/);
});
