import assert from "node:assert/strict";
import test from "node:test";

import {
  OPENAI_PDF_FILE_DATA_PREFIX,
  buildProjectDocumentOpenAiFileInput,
  validateProjectDocumentPdfForOpenAi,
} from "../src/lib/ai/document-file-input.ts";

test("builds Responses API PDF file_data as an application/pdf data URL", () => {
  const bytes = Buffer.from("%PDF-1.7 test content");
  const content = buildProjectDocumentOpenAiFileInput({
    bytes,
    fileName: "panel-board.pdf",
    maxSizeBytes: 20 * 1024 * 1024,
    mimeType: "application/pdf",
  });

  assert.equal(content.type, "input_file");
  assert.equal(content.detail, "high");
  assert.equal(content.filename, "panel-board.pdf");
  assert.ok(content.file_data.startsWith(OPENAI_PDF_FILE_DATA_PREFIX));
  assert.equal(
    content.file_data,
    `${OPENAI_PDF_FILE_DATA_PREFIX}${bytes.toString("base64")}`,
  );
  assert.notEqual(content.file_data, bytes.toString("base64"));
});

test("normalizes unsafe or empty PDF filenames before OpenAI input", () => {
  assert.equal(
    buildProjectDocumentOpenAiFileInput({
      bytes: Buffer.from("pdf"),
      fileName: "../",
      maxSizeBytes: 20 * 1024 * 1024,
      mimeType: "application/pdf",
    }).filename,
    "project-document.pdf",
  );
  assert.equal(
    buildProjectDocumentOpenAiFileInput({
      bytes: Buffer.from("pdf"),
      fileName: "project-main",
      maxSizeBytes: 20 * 1024 * 1024,
      mimeType: "application/pdf",
    }).filename,
    "project-main.pdf",
  );
});

test("rejects invalid PDF bytes and metadata before OpenAI call", () => {
  assert.deepEqual(
    validateProjectDocumentPdfForOpenAi({
      bytes: Buffer.alloc(0),
      fileName: "empty.pdf",
      maxSizeBytes: 20 * 1024 * 1024,
      mimeType: "application/pdf",
    }),
    {
      ok: false,
      reason: "empty_pdf",
    },
  );
  assert.deepEqual(
    validateProjectDocumentPdfForOpenAi({
      bytes: Buffer.from("pdf"),
      fileName: "wrong.txt",
      maxSizeBytes: 20 * 1024 * 1024,
      mimeType: "text/plain",
    }),
    {
      ok: false,
      reason: "unsupported_file_type",
    },
  );
});
