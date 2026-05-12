import assert from "node:assert/strict";
import test from "node:test";

import { summarizeProjectMaterials } from "../src/server/services/material-service";

test("summarizes project materials across projects", () => {
  const summary = summarizeProjectMaterials([
    {
      projectId: "project-1",
      source: "rule",
      totalPrice: "12.50",
    },
    {
      projectId: "project-1",
      source: "manual",
      totalPrice: "7.50",
    },
    {
      projectId: "project-2",
      source: "rule",
      totalPrice: "10",
    },
  ]);

  assert.deepEqual(summary, {
    manualLineCount: 1,
    materialLineCount: 3,
    projectCount: 2,
    totalMaterialValue: "30.00",
  });
});
