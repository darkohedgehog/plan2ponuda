import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("document analysis route is authenticated, rate limited, and thin", () => {
  const source = readSource(
    "src/app/api/projects/[projectId]/documents/[documentId]/analyze/route.ts",
  );

  assert.match(source, /requireApiUser/);
  assert.match(source, /checkRateLimitOrThrow/);
  assert.match(source, /projectDocumentAnalysis/);
  assert.match(source, /analyzeProjectDocument/);
  assert.doesNotMatch(source, /prisma\./);
  assert.doesNotMatch(source, /getOpenAiClient/);
});
