import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("schema defines project document analysis persistence", () => {
  const schema = readSource("prisma/schema.prisma");

  assert.match(schema, /enum ProjectDocumentAnalysisStatus\s*\{/);
  assert.match(schema, /pending/);
  assert.match(schema, /analyzing/);
  assert.match(schema, /completed/);
  assert.match(schema, /failed/);
  assert.match(schema, /model ProjectDocumentAnalysis\s*\{/);
  assert.match(schema, /projectDocumentId\s+String/);
  assert.match(schema, /rawResponseJson\s+Json\?/);
  assert.match(schema, /parsedResponseJson\s+Json\?/);
  assert.match(schema, /status\s+ProjectDocumentAnalysisStatus\s+@default\(pending\)/);
  assert.match(schema, /@@index\(\[projectDocumentId\]\)/);
  assert.match(schema, /@@index\(\[status\]\)/);
  assert.match(schema, /@@index\(\[createdAt\]\)/);
  assert.match(schema, /analyses\s+ProjectDocumentAnalysis\[\]/);
});
