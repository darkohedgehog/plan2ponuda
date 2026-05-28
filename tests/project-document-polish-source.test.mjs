import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMessages(locale) {
  return JSON.parse(readSource(`messages/${locale}.json`));
}

test("candidate review UI shows imported state and locks imported quote fields", () => {
  const source = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );
  const stateSource = readSource(
    "src/components/projects/project-document-candidate-review-state.ts",
  );

  assert.match(stateSource, /importedAt/);
  assert.match(stateSource, /candidate\.importedAt !== null/);
  assert.match(source, /importedProjectMaterialId/);
  assert.match(source, /importedToQuote/);
  assert.match(source, /editImportedLineOnQuotePage/);
  assert.match(source, /changesAfterImportDoNotUpdateQuoteLinesYet/);
  assert.match(source, /const isLocked = isImported \|\| isImportedToQuote/);
  assert.match(source, /disabled=\{isLocked\}/);
  assert.match(source, /ImportedStateBadge/);
});

test("import summary reports imported, labor skipped, and already imported counts", () => {
  const typeSource = readSource("src/types/project-document.ts");
  const serviceSource = readSource(
    "src/server/services/project-document-candidate-import-service.ts",
  );
  const componentSource = readSource(
    "src/components/projects/project-document-candidate-review.tsx",
  );

  assert.match(typeSource, /alreadyImportedCount:\s*number/);
  assert.match(serviceSource, /alreadyImportedCount/);
  assert.match(componentSource, /laborSkippedCount/);
  assert.match(componentSource, /alreadyImportedItems/);
  assert.match(componentSource, /skippedLaborItems/);
});

test("quote service maps document_ai project materials back to candidate source metadata", () => {
  const source = readSource("src/server/services/quote-service.ts");

  assert.match(source, /ProjectMaterialDocumentCandidateSource/);
  assert.match(source, /documentCandidateSource/);
  assert.match(source, /projectDocumentCandidate\.findMany/);
  assert.match(source, /importedProjectMaterialId:\s*\{\s*in:/);
  assert.match(source, /sourceReference/);
  assert.match(source, /confidence/);
  assert.match(source, /fileName/);
});

test("quote material UI labels document_ai rows as project document sources", () => {
  const quoteEditorSource = readSource(
    "src/components/quote/quote-material-editor.tsx",
  );
  const projectMaterialsSource = readSource(
    "src/components/materials/project-materials-overview.tsx",
  );

  assert.match(quoteEditorSource, /documentCandidateSource/);
  assert.match(quoteEditorSource, /sources\.documentAi/);
  assert.match(quoteEditorSource, /sourceReference/);
  assert.match(quoteEditorSource, /formatConfidence/);
  assert.match(projectMaterialsSource, /sources\.documentAi/);
});

test("localized document_ai source labels are present for UI and Excel exports", () => {
  for (const locale of ["en", "hr", "sr", "de", "sl"]) {
    const messages = readMessages(locale);

    assert.equal(typeof messages.Materials.sources.documentAi, "string");
    assert.ok(messages.Materials.sources.documentAi.length > 0);
    assert.equal(typeof messages.QuoteExcel.materialSources.document_ai, "string");
    assert.ok(messages.QuoteExcel.materialSources.document_ai.length > 0);

    for (const key of [
      "alreadyImported",
      "changesAfterImportDoNotUpdateQuoteLinesYet",
      "editImportedLineOnQuotePage",
      "imported",
      "importedToQuote",
      "laborItemsReviewedButNotImportedYet",
    ]) {
      assert.equal(
        typeof messages.ProjectDocumentationAnalysis[key],
        "string",
        `${locale} missing ${key}`,
      );
    }
  }
});
