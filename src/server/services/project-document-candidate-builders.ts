import type { Prisma } from "../../../generated/prisma/client";

import type { ProjectDocumentAnalysisResult } from "../../types/project-document";

export const DOCUMENT_AI_PROJECT_MATERIAL_SOURCE = "document_ai";

type ImportableMaterialCandidate = {
  category: string | null;
  name: string;
  quantity: number | string | Prisma.Decimal | null;
  unit: string;
  unitPrice: number | string | Prisma.Decimal | null;
};

const materialCategoryValues = [
  "cable",
  "socket",
  "switch",
  "breaker",
  "box",
  "panel",
  "other",
] as const;
const materialUnitValues = ["pcs", "m", "set"] as const;

type ImportMaterialCategory = (typeof materialCategoryValues)[number];
type ImportMaterialUnit = (typeof materialUnitValues)[number];

export function buildProjectDocumentCandidateCreateInputs(
  analysisId: string,
  parsedResponse: ProjectDocumentAnalysisResult,
): Prisma.ProjectDocumentCandidateCreateManyInput[] {
  const materialRows = parsedResponse.materialCandidates.map(
    (candidate, index): Prisma.ProjectDocumentCandidateCreateManyInput => ({
      category: candidate.category,
      confidence: toNullableDecimal(candidate.confidence),
      name: candidate.name,
      notes: candidate.notes,
      originalJson: toPrismaJson(candidate),
      projectDocumentAnalysisId: analysisId,
      quantity: toNullableDecimal(candidate.quantity),
      sortOrder: index,
      sourceReference: candidate.sourceReference,
      status: "pending",
      totalPrice: null,
      type: "material",
      unit: candidate.unit,
      unitPrice: null,
    }),
  );
  const laborRows = parsedResponse.laborCandidates.map(
    (candidate, index): Prisma.ProjectDocumentCandidateCreateManyInput => ({
      category: "labor",
      confidence: toNullableDecimal(candidate.confidence),
      description: candidate.description,
      name: candidate.name,
      notes: candidate.notes,
      originalJson: toPrismaJson(candidate),
      projectDocumentAnalysisId: analysisId,
      quantity: toNullableDecimal(candidate.quantity),
      sortOrder: index,
      sourceReference: candidate.sourceReference,
      status: "pending",
      totalPrice: null,
      type: "labor",
      unit: candidate.unit,
      unitPrice: null,
    }),
  );

  return [...materialRows, ...laborRows];
}

export function calculateCandidateTotalPrice(
  quantity: number | null,
  unitPrice: number | null,
): number | null {
  if (quantity === null || unitPrice === null) {
    return null;
  }

  return Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
}

export function buildImportedProjectMaterialCreateInput(
  projectId: string,
  candidate: ImportableMaterialCandidate,
): Prisma.ProjectMaterialUncheckedCreateInput {
  const quantity = toImportMoneyDecimal(candidate.quantity);
  const unitPrice = toImportMoneyDecimal(candidate.unitPrice);
  const totalPrice = roundMoney(quantity * unitPrice);
  const manualCategory = resolveMaterialCategory(candidate.category);
  const manualUnit = resolveMaterialUnit(candidate.unit);

  return {
    manualCategory,
    manualName: candidate.name.trim(),
    manualUnit,
    materialId: null,
    projectId,
    quantity,
    source: DOCUMENT_AI_PROJECT_MATERIAL_SOURCE,
    totalPrice,
    unitPrice,
  };
}

function toNullableDecimal(value: number | null): number | null {
  return value;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function resolveMaterialCategory(
  category: string | null,
): ImportMaterialCategory {
  return materialCategoryValues.some((value) => value === category)
    ? (category as ImportMaterialCategory)
    : "other";
}

function resolveMaterialUnit(unit: string): ImportMaterialUnit {
  return materialUnitValues.some((value) => value === unit)
    ? (unit as ImportMaterialUnit)
    : "pcs";
}

function toImportDecimal(
  value: number | string | Prisma.Decimal | null,
): number {
  if (value === null) {
    return 0;
  }

  const decimal = Number(value);

  return Number.isFinite(decimal) && decimal >= 0 ? decimal : 0;
}

function toImportMoneyDecimal(
  value: number | string | Prisma.Decimal | null,
): number {
  return roundMoney(toImportDecimal(value));
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
