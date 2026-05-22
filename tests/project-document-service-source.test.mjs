import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("project document service enforces ownership and Pro upload policy", () => {
  const source = readSource("src/server/services/project-document-service.ts");

  assert.match(source, /export async function getProjectDocuments/);
  assert.match(source, /export async function uploadProjectDocument/);
  assert.match(source, /export async function deleteProjectDocument/);
  assert.match(source, /project:\s*\{[\s\S]*userId/);
  assert.match(source, /getEffectivePlan/);
  assert.match(source, /pro_plan_required/);
  assert.doesNotMatch(source, /consumeUsageOrThrow/);
  assert.doesNotMatch(source, /incrementUsage/);
  assert.doesNotMatch(source, /openai/i);
});

test("project document service uses controlled storage paths and cleanup", () => {
  const source = readSource("src/server/services/project-document-service.ts");

  assert.match(source, /buildProjectDocumentStoragePath/);
  assert.match(source, /assertProjectOwnedStoragePath/);
  assert.match(source, /PROJECT_FILES_BUCKET/);
  assert.match(source, /\.upload\(filePath,\s*file/);
  assert.match(source, /\.remove\(\[filePath\]\)/);
});
