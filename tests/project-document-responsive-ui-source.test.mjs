import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("uploaded document rows keep actions visible and responsive", () => {
  const cardSource = readSource(
    "src/components/projects/project-documentation-analysis-card.tsx",
  );
  const formSource = readSource(
    "src/components/projects/project-document-upload-form.tsx",
  );

  assert.match(cardSource, /min-w-0 flex-1/);
  assert.match(cardSource, /flex min-w-0 flex-col gap-3 sm:flex-row/);
  assert.match(cardSource, /w-full sm:w-auto/);
  assert.match(cardSource, /wrap-break-word break-words/);
  assert.doesNotMatch(cardSource, /md:flex-row md:items-start md:justify-between/);

  assert.match(formSource, /className="w-full sm:w-auto"/);
  assert.match(formSource, /className="flex min-w-0 flex-col items-stretch gap-2 sm:items-start"/);
});

test("candidate review avoids fixed-width editor grids that overflow nested project cards", () => {
  const source = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );

  assert.match(source, /overflow-hidden/);
  assert.match(source, /xl:grid-cols-\[minmax\(0,1fr\)_minmax\(0,0\.75fr\)_minmax\(0,0\.75fr\)\]/);
  assert.match(source, /xl:col-span-3/);
  assert.match(source, /md:grid-cols-3 xl:grid-cols-1/);
  assert.match(source, /wrap-break-word break-words/);

  assert.doesNotMatch(source, /lg:grid-cols-\[minmax\(12rem/);
  assert.doesNotMatch(source, /sm:grid-cols-3 lg:grid-cols-1/);
});
