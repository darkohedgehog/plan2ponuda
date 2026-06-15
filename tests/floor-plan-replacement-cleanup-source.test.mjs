import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function getFunctionBody(source, functionName) {
  const start = source.indexOf(`async function ${functionName}`);
  assert.notEqual(start, -1, `${functionName} not found`);

  const nextFunction = source.indexOf("\nasync function", start + 1);
  const nextExport = source.indexOf("\nexport ", start + 1);
  const endCandidates = [nextFunction, nextExport].filter((index) => index > -1);
  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : undefined;

  return source.slice(start, end);
}

test("floor-plan replacement removes the old project-owned file after DB update succeeds", () => {
  const source = readSource("src/server/services/project-service.ts");

  assert.match(source, /removeReplacedFloorPlanFile/);
  assert.match(source, /previousSourceFilePath:\s*currentProject\.sourceFilePath/);
  assert.match(
    source,
    /await removeReplacedFloorPlanFile\(\s*project\.id,\s*updateResult\.previousSourceFilePath,\s*filePath,\s*\)/,
  );
  assert.match(source, /project:\s*nextProject/);
});

test("floor-plan replacement cleanup skips same or untrusted old paths and does not fail upload", () => {
  const source = readSource("src/server/services/project-service.ts");
  const helperBody = getFunctionBody(source, "removeReplacedFloorPlanFile");

  assert.match(helperBody, /previousSourceFilePath === nextSourceFilePath/);
  assert.match(helperBody, /!isProjectOwnedStoragePath\(projectId,\s*previousSourceFilePath\)/);
  assert.match(helperBody, /warnInvalidStoredProjectPath\("replacement_cleanup",\s*projectId\)/);
  assert.match(helperBody, /await removeProjectStorageFiles\(\[previousSourceFilePath\]\)/);
});
