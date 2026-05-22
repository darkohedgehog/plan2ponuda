import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("project deletion includes safe project document file paths in storage cleanup", () => {
  const projectService = readSource("src/server/services/project-service.ts");
  const storagePaths = readSource(
    "src/server/services/project-storage-paths.ts",
  );

  assert.match(projectService, /documents:\s*\{[\s\S]*filePath/);
  assert.match(projectService, /documentFilePaths/);
  assert.match(projectService, /getProjectStoragePathsToDelete/);
  assert.match(storagePaths, /documentFilePaths/);
});
