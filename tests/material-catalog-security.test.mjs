import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canEditGlobalMaterialCatalog,
  getManualProjectMaterialSnapshot,
  getProjectMaterialDisplaySnapshot,
  isGlobalCatalogMaterial,
  resolveGeneratedProjectMaterialUnitPrice,
} from "../src/lib/materials/project-materials.ts";

test("global material default-price updates are admin-only at the API boundary", () => {
  const routeSource = readFileSync(
    new URL("../src/app/api/materials/[materialId]/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(routeSource, /requireApiAdmin/);
  assert.doesNotMatch(routeSource, /requireApiUser/);
  assert.equal(canEditGlobalMaterialCatalog("user"), false);
  assert.equal(canEditGlobalMaterialCatalog("admin"), true);
});

test("manual project material snapshots do not require global Material rows", () => {
  const snapshot = getManualProjectMaterialSnapshot({
    category: "other",
    name: "Custom cable",
    unit: "m",
  });

  assert.deepEqual(snapshot, {
    manualCategory: "other",
    manualName: "Custom cable",
    manualUnit: "m",
  });
  assert.equal(Object.hasOwn(snapshot, "materialId"), false);
});

test("manual project materials remain displayable without a catalog relation", () => {
  const material = getProjectMaterialDisplaySnapshot(
    {
      manualCategory: "other",
      manualName: "Project-only cable",
      manualUnit: "m",
      material: undefined,
      source: "manual",
    },
    "Material",
  );

  assert.deepEqual(material, {
    category: "other",
    name: "Project-only cable",
    unit: "m",
  });
});

test("generated materials keep catalog identity and prices", () => {
  const material = getProjectMaterialDisplaySnapshot(
    {
      material: {
        category: "socket",
        code: "SOCKET-MODULE",
        defaultPrice: "3.50",
        name: "Socket module",
        unit: "pcs",
      },
      source: "rule",
    },
    "Material",
  );

  assert.deepEqual(material, {
    category: "socket",
    code: "SOCKET-MODULE",
    defaultPrice: "3.50",
    name: "Socket module",
    unit: "pcs",
  });
});

test("generated material refresh preserves project-specific unit prices", () => {
  assert.equal(
    resolveGeneratedProjectMaterialUnitPrice({
      catalogDefaultPrice: 3.5,
    }),
    3.5,
  );
  assert.equal(
    resolveGeneratedProjectMaterialUnitPrice({
      catalogDefaultPrice: 3.5,
      existingUnitPrice: 4.25,
    }),
    4.25,
  );
});

test("global catalog visibility excludes project-local manual materials", () => {
  assert.equal(isGlobalCatalogMaterial({ code: "CABLE-3X2.5" }), true);
  assert.equal(isGlobalCatalogMaterial({ code: null }), false);
  assert.equal(isGlobalCatalogMaterial({ code: "" }), false);
});
