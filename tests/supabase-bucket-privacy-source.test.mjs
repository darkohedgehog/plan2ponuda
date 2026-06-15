import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("deployment docs require project-files bucket privacy and signed previews", () => {
  const checklist = readSource(".codex/DEPLOYMENT_CHECKLIST.md");
  const report = readSource("security_best_practices_report.md");

  for (const source of [checklist, report]) {
    assert.match(source, /project-files/);
    assert.match(source, /private/);
    assert.match(source, /anon reads\/writes must fail/);
    assert.match(source, /only the server\/service role should write/i);
    assert.match(source, /signed URLs/);
    assert.match(source, /service role key must never be exposed client-side/i);
  }
});

test("storage code uses the server Supabase key and signed URLs for project previews", () => {
  const serverClient = readSource("src/lib/supabase/server-client.ts");
  const envSource = readSource("src/lib/utils/env.ts");
  const projectService = readSource("src/server/services/project-service.ts");

  assert.match(serverClient, /getSupabaseServerEnv/);
  assert.match(envSource, /SUPABASE_SECRET_KEY/);
  assert.match(projectService, /PROJECT_FILES_BUCKET = "project-files"/);
  assert.match(projectService, /createSignedUrl/);
  assert.doesNotMatch(projectService, /getPublicUrl/);
});
