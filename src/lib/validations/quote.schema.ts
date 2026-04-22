import { z } from "zod";

export const materialCategorySchema = z.enum([
  "cable",
  "socket",
  "switch",
  "breaker",
  "box",
  "panel",
  "other",
]);

export const materialUnitSchema = z.enum(["pcs", "m", "set"]);

const decimalInputSchema = z.number().finite().nonnegative().max(999999.99);

export const updateExistingProjectMaterialSchema = z.object({
  id: z.string().min(1),
  quantity: decimalInputSchema,
  unitPrice: decimalInputSchema,
});

export const createManualProjectMaterialSchema = z.object({
  category: materialCategorySchema,
  name: z.string().trim().min(1).max(120),
  quantity: decimalInputSchema,
  unit: materialUnitSchema,
  unitPrice: decimalInputSchema,
});

export const updateProjectMaterialsSchema = z.object({
  deletedMaterialIds: z.array(z.string().min(1)).max(200).default([]),
  existingMaterials: z.array(updateExistingProjectMaterialSchema).max(200),
  manualMaterials: z.array(createManualProjectMaterialSchema).max(100),
});

export type UpdateProjectMaterialsInput = z.infer<
  typeof updateProjectMaterialsSchema
>;
