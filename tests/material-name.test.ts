import assert from "node:assert/strict";
import test from "node:test";

import {
  getLocalizedMaterialName,
  getMaterialCatalogItemKey,
  type MaterialCatalogItemKey,
} from "../src/lib/i18n/material-name";

const materialNames: Record<MaterialCatalogItemKey, string> = {
  breaker: "Osigurač",
  cable3x15: "Kabel 3x1,5",
  cable3x25: "Kabel 3x2,5",
  installationMisc: "Instalacijski potrošni materijal",
  junctionBox: "Razvodna kutija",
  lightPoint: "Rasvjetno mjesto",
  panel: "Razvodna ploča",
  socketModule: "Utičnički modul",
  switchModule: "Prekidački modul",
};

function translateMaterialName(key: MaterialCatalogItemKey): string {
  return materialNames[key];
}

test("maps known generated material codes to translation keys", () => {
  assert.equal(getMaterialCatalogItemKey("SOCKET-MODULE"), "socketModule");
  assert.equal(getMaterialCatalogItemKey("CABLE-3X2.5"), "cable3x25");
});

test("localizes known generated material names from the stable code", () => {
  assert.equal(
    getLocalizedMaterialName(
      {
        code: "SOCKET-MODULE",
        name: "Socket module",
        source: "rule",
      },
      translateMaterialName,
    ),
    "Utičnički modul",
  );
});

test("preserves manual material names exactly as entered", () => {
  assert.equal(
    getLocalizedMaterialName(
      {
        code: "SOCKET-MODULE",
        name: "Custom socket module",
        source: "manual",
      },
      translateMaterialName,
    ),
    "Custom socket module",
  );
});

test("falls back to the stored material name for missing or unknown codes", () => {
  assert.equal(
    getLocalizedMaterialName(
      {
        name: "Custom cable",
        source: "rule",
      },
      translateMaterialName,
    ),
    "Custom cable",
  );
  assert.equal(
    getLocalizedMaterialName(
      {
        code: "CUSTOM-CODE",
        name: "Custom panel",
        source: "rule",
      },
      translateMaterialName,
    ),
    "Custom panel",
  );
});
