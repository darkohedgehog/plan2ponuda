const catalogItemKeysByCode = {
  BREAKER: "breaker",
  "CABLE-3X1.5": "cable3x15",
  "CABLE-3X2.5": "cable3x25",
  "INSTALLATION-MISC": "installationMisc",
  "JUNCTION-BOX": "junctionBox",
  "LIGHT-POINT": "lightPoint",
  PANEL: "panel",
  "SOCKET-MODULE": "socketModule",
  "SWITCH-MODULE": "switchModule",
} as const;

export type MaterialCatalogItemCode = keyof typeof catalogItemKeysByCode;
export type MaterialCatalogItemKey =
  (typeof catalogItemKeysByCode)[MaterialCatalogItemCode];

export type MaterialNameLocalizationInput = {
  code?: string;
  name: string;
  source?: string;
};

export function getMaterialCatalogItemKey(
  code: string | undefined,
): MaterialCatalogItemKey | null {
  if (!code || !isMaterialCatalogItemCode(code)) {
    return null;
  }

  return catalogItemKeysByCode[code];
}

export function getLocalizedMaterialName(
  material: MaterialNameLocalizationInput,
  translateCatalogItem: (key: MaterialCatalogItemKey) => string,
): string {
  if (material.source === "manual") {
    return material.name;
  }

  const catalogItemKey = getMaterialCatalogItemKey(material.code);

  return catalogItemKey
    ? translateCatalogItem(catalogItemKey)
    : material.name;
}

function isMaterialCatalogItemCode(
  code: string,
): code is MaterialCatalogItemCode {
  return Object.prototype.hasOwnProperty.call(catalogItemKeysByCode, code);
}
