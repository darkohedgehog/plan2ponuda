import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSchema() {
  return readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
}

test("schema defines project documents for uploaded PDFs", () => {
  const schema = readSchema();

  assert.match(schema, /enum ProjectDocumentStatus\s*\{[\s\S]*uploaded/);
  assert.match(schema, /analysis_pending/);
  assert.match(schema, /analyzing/);
  assert.match(schema, /analyzed/);
  assert.match(schema, /failed/);
  assert.match(schema, /model ProjectDocument\s*\{/);
  assert.match(schema, /projectId\s+String/);
  assert.match(schema, /filePath\s+String/);
  assert.match(schema, /fileName\s+String/);
  assert.match(schema, /mimeType\s+String/);
  assert.match(schema, /sizeBytes\s+Int/);
  assert.match(
    schema,
    /status\s+ProjectDocumentStatus\s+@default\(uploaded\)/,
  );
  assert.match(
    schema,
    /project\s+Project\s+@relation\(fields: \[projectId\], references: \[id\], onDelete: Cascade\)/,
  );
  assert.match(schema, /@@index\(\[projectId\]\)/);
  assert.match(schema, /@@index\(\[status\]\)/);
  assert.match(schema, /@@index\(\[createdAt\]\)/);
  assert.match(schema, /documents\s+ProjectDocument\[\]/);
});
