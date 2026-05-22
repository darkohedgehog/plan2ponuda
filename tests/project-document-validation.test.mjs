import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES,
  validateProjectDocumentFile,
} from "../src/lib/validations/project-document.schema.ts";

function createFile({
  name,
  size,
  type,
}) {
  return new File([new Uint8Array(size)], name, { type });
}

test("accepts PDF documents up to the MVP size limit", () => {
  const file = createFile({
    name: "documentation.pdf",
    size: 1024,
    type: "application/pdf",
  });

  assert.equal(validateProjectDocumentFile(file), null);
});

test("rejects non-PDF documents", () => {
  assert.deepEqual(
    validateProjectDocumentFile(
      createFile({
        name: "documentation.png",
        size: 1024,
        type: "image/png",
      }),
    ),
    {
      code: "unsupported_file_type",
      message: "Upload a PDF project document.",
    },
  );
});

test("rejects PDF MIME type with non-PDF extension when a filename exists", () => {
  assert.deepEqual(
    validateProjectDocumentFile(
      createFile({
        name: "documentation.txt",
        size: 1024,
        type: "application/pdf",
      }),
    ),
    {
      code: "unsupported_file_type",
      message: "Upload a PDF project document.",
    },
  );
});

test("rejects oversized PDF documents", () => {
  assert.deepEqual(
    validateProjectDocumentFile(
      createFile({
        name: "large-documentation.pdf",
        size: MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES + 1,
        type: "application/pdf",
      }),
    ),
    {
      code: "file_too_large",
      message: "Project documentation PDFs must be 20MB or smaller.",
    },
  );
});
