import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const clientComponentPaths = [
  "src/components/projects/project-document-upload-form.tsx",
  "src/components/projects/project-documentation-analysis-card.tsx",
];

test("project document client components do not import OpenAI or server AI modules", () => {
  for (const path of clientComponentPaths) {
    const source = readFileSync(join(process.cwd(), path), "utf8");

    assert.doesNotMatch(source, /from "openai"/);
    assert.doesNotMatch(source, /@\/lib\/ai/);
    assert.doesNotMatch(source, /@\/server\/services/);
    assert.doesNotMatch(source, /OPENAI_API_KEY/);
  }
});
