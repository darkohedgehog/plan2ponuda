import type {
  Material,
  MaterialCategory,
  MaterialUnit,
} from "../../types/quote";

export type MaterialCatalogEditRole = "admin" | "user";

type ManualProjectMaterialSnapshotInput = {
  category: MaterialCategory;
  name: string;
  unit: MaterialUnit;
};

export type ManualProjectMaterialSnapshot = {
  manualCategory: MaterialCategory;
  manualName: string;
  manualUnit: MaterialUnit;
};

type ProjectMaterialDisplayInput = {
  manualCategory?: MaterialCategory | null;
  manualName?: string | null;
  manualUnit?: MaterialUnit | null;
  material?:
    | Pick<Material, "category" | "code" | "defaultPrice" | "name" | "unit">
    | null;
  source?: string;
};

export type ProjectMaterialDisplaySnapshot = {
  category: MaterialCategory;
  code?: string;
  defaultPrice?: string;
  name: string;
  unit: MaterialUnit;
};

export function canEditGlobalMaterialCatalog(
  role: MaterialCatalogEditRole | null | undefined,
): boolean {
  return role === "admin";
}

export function isGlobalCatalogMaterial(material: {
  code?: string | null;
}): boolean {
  return typeof material.code === "string" && material.code.trim().length > 0;
}

export function getManualProjectMaterialSnapshot(
  material: ManualProjectMaterialSnapshotInput,
): ManualProjectMaterialSnapshot {
  return {
    manualCategory: material.category,
    manualName: material.name.trim(),
    manualUnit: material.unit,
  };
}

export function resolveGeneratedProjectMaterialUnitPrice({
  catalogDefaultPrice,
  existingUnitPrice,
}: {
  catalogDefaultPrice: number;
  existingUnitPrice?: number | null;
}): number {
  return existingUnitPrice ?? catalogDefaultPrice;
}

export function getProjectMaterialDisplaySnapshot(
  projectMaterial: ProjectMaterialDisplayInput,
  fallbackName: string,
): ProjectMaterialDisplaySnapshot {
  if (projectMaterial.material) {
    return {
      category: projectMaterial.material.category,
      code: projectMaterial.material.code,
      defaultPrice: projectMaterial.material.defaultPrice,
      name: projectMaterial.material.name,
      unit: projectMaterial.material.unit,
    };
  }

  return {
    category: projectMaterial.manualCategory ?? "other",
    name: projectMaterial.manualName ?? fallbackName,
    unit: projectMaterial.manualUnit ?? "pcs",
  };
}
