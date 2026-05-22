import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProjectDocumentStoragePath,
  getProjectDocumentStoragePathsToDelete,
  isProjectOwnedStoragePath,
} from "../src/server/services/project-storage-paths.ts";

test("builds controlled project-owned document storage paths", () => {
  const path = buildProjectDocumentStoragePath("project-1", "document-1");

  assert.equal(path, "projects/project-1/documents/document-1/source.pdf");
  assert.equal(isProjectOwnedStoragePath("project-1", path), true);
  assert.equal(path.includes("invoice.pdf"), false);
});

test("rejects unsafe project or document path segments", () => {
  const unsafeValues = [
    "",
    "../project",
    "project/one",
    "project\\one",
    "%2e%2e",
    "https://example.com/project",
  ];

  for (const value of unsafeValues) {
    assert.throws(
      () => buildProjectDocumentStoragePath(value, "document-1"),
      /Invalid storage path segment/,
    );
    assert.throws(
      () => buildProjectDocumentStoragePath("project-1", value),
      /Invalid storage path segment/,
    );
  }
});

test("collects only safe project document paths for deletion", () => {
  assert.deepEqual(
    getProjectDocumentStoragePathsToDelete("project-1", [
      "projects/project-1/documents/document-1/source.pdf",
      "projects/project-2/documents/document-2/source.pdf",
      "projects/project-1/%2e%2e/project-2/secret.pdf",
      "https://example.com/source.pdf",
    ]),
    ["projects/project-1/documents/document-1/source.pdf"],
  );
});
