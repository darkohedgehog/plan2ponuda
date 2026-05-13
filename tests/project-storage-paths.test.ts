import assert from "node:assert/strict";
import test from "node:test";

import { getProjectStoragePathsToDelete } from "../src/server/services/project-storage-paths";

test("collects project-owned source and preview storage paths", () => {
  const paths = getProjectStoragePathsToDelete({
    previewPath: "projects/project-1/preview.png",
    projectId: "project-1",
    sourceFilePath: "projects/project-1/floor-plan.pdf",
  });

  assert.deepEqual(paths, [
    "projects/project-1/floor-plan.pdf",
    "projects/project-1/preview.png",
  ]);
});

test("ignores duplicate, external, and non-project storage paths", () => {
  assert.deepEqual(
    getProjectStoragePathsToDelete({
      previewPath: "https://example.com/preview.png",
      projectId: "project-1",
      sourceFilePath: "projects/project-1/floor-plan.pdf",
    }),
    ["projects/project-1/floor-plan.pdf"],
  );

  assert.deepEqual(
    getProjectStoragePathsToDelete({
      previewPath: "projects/project-2/preview.png",
      projectId: "project-1",
      sourceFilePath: "projects/project-1/../project-2/floor-plan.pdf",
    }),
    [],
  );

  assert.deepEqual(
    getProjectStoragePathsToDelete({
      previewPath: "projects/project-1/floor-plan.pdf",
      projectId: "project-1",
      sourceFilePath: "projects/project-1/floor-plan.pdf",
    }),
    ["projects/project-1/floor-plan.pdf"],
  );
});
