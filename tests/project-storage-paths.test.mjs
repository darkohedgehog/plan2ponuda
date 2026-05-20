import assert from "node:assert/strict";
import test from "node:test";

import { createProjectSchema } from "../src/lib/validations/project.schema.ts";
import * as storagePaths from "../src/server/services/project-storage-paths.ts";

const projectId = "project-1";
const otherProjectId = "project-2";

test("validates project-owned storage paths", () => {
  assert.equal(typeof storagePaths.isProjectOwnedStoragePath, "function");
  assert.equal(
    storagePaths.isProjectOwnedStoragePath(
      projectId,
      `projects/${projectId}/floor-plan.png`,
    ),
    true,
  );
  assert.equal(
    storagePaths.isProjectOwnedStoragePath(
      projectId,
      `projects/${projectId}/some/file.png`,
    ),
    true,
  );
});

test("rejects unsafe or cross-project storage paths", () => {
  assert.equal(typeof storagePaths.isProjectOwnedStoragePath, "function");

  const invalidPaths = [
    `projects/${otherProjectId}/floor-plan.png`,
    "../secret",
    `projects/${projectId}/../other/file.png`,
    `projects/${projectId}/%2e%2e/other/file.png`,
    `projects/${projectId}/%2E%2E/other/file.png`,
    "https://example.com/file.png",
    "/absolute/path",
    "",
    "projects/",
    `projects/${projectId}-other/floor-plan.png`,
  ];

  for (const path of invalidPaths) {
    assert.equal(
      storagePaths.isProjectOwnedStoragePath(projectId, path),
      false,
      `expected ${path || "<empty>"} to be rejected`,
    );
  }
});

test("returns the expected project file prefix", () => {
  assert.equal(typeof storagePaths.getExpectedProjectFilePrefix, "function");
  assert.equal(
    storagePaths.getExpectedProjectFilePrefix(projectId),
    `projects/${projectId}/`,
  );
});

test("asserts project-owned storage paths", () => {
  assert.equal(typeof storagePaths.assertProjectOwnedStoragePath, "function");
  assert.equal(
    storagePaths.assertProjectOwnedStoragePath(
      projectId,
      `projects/${projectId}/floor-plan.pdf`,
    ),
    `projects/${projectId}/floor-plan.pdf`,
  );
  assert.throws(
    () =>
      storagePaths.assertProjectOwnedStoragePath(
        projectId,
        `projects/${otherProjectId}/floor-plan.pdf`,
      ),
    /Invalid project storage path/,
  );
});

test("collects only project-owned source and preview storage paths for deletion", () => {
  assert.deepEqual(
    storagePaths.getProjectStoragePathsToDelete({
      previewPath: `projects/${projectId}/preview.png`,
      projectId,
      sourceFilePath: `projects/${projectId}/floor-plan.pdf`,
    }),
    [
      `projects/${projectId}/floor-plan.pdf`,
      `projects/${projectId}/preview.png`,
    ],
  );

  assert.deepEqual(
    storagePaths.getProjectStoragePathsToDelete({
      previewPath: `projects/${otherProjectId}/preview.png`,
      projectId,
      sourceFilePath: `projects/${projectId}/%2e%2e/${otherProjectId}/floor-plan.pdf`,
    }),
    [],
  );
});

test("public project creation input strips storage paths", () => {
  const parsed = createProjectSchema.parse({
    areaM2: 42,
    clientName: "Client",
    name: "New project",
    objectType: "apartment",
    previewPath: `projects/${otherProjectId}/preview.png`,
    sourceFilePath: `projects/${otherProjectId}/floor-plan.png`,
  });

  assert.equal(Object.hasOwn(parsed, "sourceFilePath"), false);
  assert.equal(Object.hasOwn(parsed, "previewPath"), false);
});
