import assert from "node:assert/strict";
import test from "node:test";

import { getQuoteWorkspaceMaterialState } from "../src/server/services/quote-workspace-state";

test("generates initial materials when rooms exist but project materials do not", () => {
  assert.equal(
    getQuoteWorkspaceMaterialState({
      projectMaterialCount: 0,
      projectStatus: "reviewed",
      roomCount: 5,
    }),
    "generate_initial_materials",
  );
});

test("loads existing materials instead of regenerating them", () => {
  assert.equal(
    getQuoteWorkspaceMaterialState({
      projectMaterialCount: 2,
      projectStatus: "quoted",
      roomCount: 5,
    }),
    "load_existing_materials",
  );
});

test("requires room review before material generation when no rooms exist", () => {
  assert.equal(
    getQuoteWorkspaceMaterialState({
      projectMaterialCount: 0,
      projectStatus: "uploaded",
      roomCount: 0,
    }),
    "needs_room_review",
  );
});

test("does not regenerate after a quoted project has no material rows", () => {
  assert.equal(
    getQuoteWorkspaceMaterialState({
      projectMaterialCount: 0,
      projectStatus: "quoted",
      roomCount: 5,
    }),
    "load_existing_materials",
  );
});

test("requires confirmation before generating from detected rooms", () => {
  assert.equal(
    getQuoteWorkspaceMaterialState({
      projectMaterialCount: 0,
      projectStatus: "uploaded",
      roomCount: 5,
    }),
    "needs_room_review",
  );
});
