import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Prisma schema defines reviewed project document candidates", () => {
  const schema = readSource("prisma/schema.prisma");

  assert.match(schema, /enum ProjectDocumentCandidateType\s*\{/);
  assert.match(schema, /material/);
  assert.match(schema, /labor/);
  assert.match(schema, /enum ProjectDocumentCandidateStatus\s*\{/);
  assert.match(schema, /pending/);
  assert.match(schema, /accepted/);
  assert.match(schema, /rejected/);
  assert.match(schema, /model ProjectDocumentCandidate\s*\{/);
  assert.match(schema, /projectDocumentAnalysisId\s+String/);
  assert.match(schema, /quantity\s+Decimal\?/);
  assert.match(schema, /unitPrice\s+Decimal\?\s+@db\.Decimal\(10,\s*2\)/);
  assert.match(schema, /totalPrice\s+Decimal\?\s+@db\.Decimal\(10,\s*2\)/);
  assert.match(schema, /confidence\s+Decimal\?\s+@db\.Decimal\(4,\s*3\)/);
  assert.match(schema, /originalJson\s+Json\?/);
  assert.match(
    schema,
    /analysis\s+ProjectDocumentAnalysis\s+@relation\(fields:\s*\[projectDocumentAnalysisId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/,
  );
  assert.match(schema, /candidates\s+ProjectDocumentCandidate\[\]/);
});

test("candidate service initializes once, enforces ownership, and avoids quote writes", () => {
  const source = readSource(
    "src/server/services/project-document-candidate-service.ts",
  );

  assert.match(source, /export async function ensureCandidatesForAnalysis/);
  assert.match(source, /buildProjectDocumentCandidateCreateInputs/);
  assert.match(source, /count\(/);
  assert.match(source, /createMany/);
  assert.match(source, /skipDuplicates:\s*true/);
  assert.match(source, /export async function getDocumentCandidates/);
  assert.match(source, /export async function saveDocumentCandidateReview/);
  assert.match(source, /projectDocumentAnalysis\.findFirst/);
  assert.match(source, /document:\s*\{[\s\S]*projectId[\s\S]*project:\s*\{[\s\S]*userId/);
  assert.match(source, /totalPrice:\s*calculateCandidateTotalPrice/);
  assert.doesNotMatch(source, /\.projectMaterial\./);
  assert.doesNotMatch(source, /\.quote\./);
});

test("candidate review route is authenticated, validated, and thin", () => {
  const source = readSource(
    "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/candidates/route.ts",
  );

  assert.match(source, /requireApiUser/);
  assert.match(source, /saveProjectDocumentCandidateReviewSchema/);
  assert.match(source, /getDocumentCandidates/);
  assert.match(source, /saveDocumentCandidateReview/);
  assert.match(source, /export async function GET/);
  assert.match(source, /export async function PUT/);
  assert.doesNotMatch(source, /prisma\./);
  assert.doesNotMatch(source, /getOpenAiClient/);
});
