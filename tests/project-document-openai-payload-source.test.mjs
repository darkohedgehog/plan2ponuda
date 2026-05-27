import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("document analysis sends PDF input_file with data URL file_data", () => {
  const source = readSource("src/lib/ai/document-analysis-service.ts");
  const helper = readSource("src/lib/ai/document-file-input.ts");

  assert.match(source, /buildProjectDocumentOpenAiFileInput/);
  assert.match(source, /validateProjectDocumentPdfForOpenAi/);
  assert.match(source, /response = await openAi\.client\.responses\.parse/);
  assert.match(helper, /OPENAI_PDF_FILE_DATA_PREFIX = "data:application\/pdf;base64,"/);
  assert.match(helper, /file_data:\s*`\$\{OPENAI_PDF_FILE_DATA_PREFIX\}\$\{validated\.base64\}`/);
  assert.doesNotMatch(source, /file_data:\s*document\.bytes\.toString\("base64"\)/);
});

test("document analysis logs only safe PDF payload metadata", () => {
  const source = readSource("src/lib/ai/document-analysis-service.ts");

  assert.match(source, /logProjectDocumentInputMetadata/);
  assert.match(source, /hasPdfDataUrl/);
  assert.match(source, /process\.env\.NODE_ENV !== "production"/);
  assert.doesNotMatch(source, /console\.(?:info|log|error)\([^)]*file_data/s);
});

test("failed documents may retry and usage is consumed only after success", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  assert.match(source, /in:\s*\["analysis_pending", "failed", "uploaded"\]/);

  const consumeIndex = source.indexOf("consumeUsageOrThrow");
  const persistIndex = source.indexOf("persistSuccessfulProjectDocumentAnalysis");
  const failedIndex = source.indexOf("markProjectDocumentAnalysisFailed");

  assert.ok(consumeIndex > persistIndex);
  assert.ok(failedIndex > -1);
  assert.doesNotMatch(
    source.slice(failedIndex, failedIndex + 900),
    /consumeUsageOrThrow/,
  );
});
