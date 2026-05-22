import { z } from "zod";

export const projectDocumentDetectedSystemSchema = z.enum([
  "power_distribution",
  "lighting",
  "sockets",
  "switches",
  "distribution_board",
  "low_voltage",
  "network",
  "fire_alarm",
  "grounding",
  "lightning_protection",
  "hvac_connections",
  "other",
]);

export const projectDocumentMaterialCategorySchema = z.enum([
  "cable",
  "socket",
  "switch",
  "breaker",
  "box",
  "panel",
  "other",
]);

export const projectDocumentMaterialUnitSchema = z.enum(["pcs", "m", "set"]);
export const projectDocumentLaborUnitSchema = z.enum([
  "hour",
  "item",
  "m2",
  "m",
  "set",
]);

const confidenceSchema = z.number().min(0).max(1);
const nullablePositiveQuantitySchema = z.number().positive().nullable();
const nullableTextSchema = z.string().trim().max(500).nullable();

export const projectDocumentMaterialCandidateSchema = z.object({
  category: projectDocumentMaterialCategorySchema,
  confidence: confidenceSchema,
  name: z.string().trim().min(1).max(160),
  notes: nullableTextSchema,
  quantity: nullablePositiveQuantitySchema,
  sourceReference: nullableTextSchema,
  unit: projectDocumentMaterialUnitSchema,
});

export const projectDocumentLaborCandidateSchema = z.object({
  confidence: confidenceSchema,
  description: nullableTextSchema,
  name: z.string().trim().min(1).max(160),
  notes: nullableTextSchema,
  quantity: nullablePositiveQuantitySchema,
  sourceReference: nullableTextSchema,
  unit: projectDocumentLaborUnitSchema,
});

export const projectDocumentAnalysisOutputSchema = z.object({
  assumptions: z.array(z.string().trim().min(1).max(300)).max(30),
  detectedSystems: z.array(projectDocumentDetectedSystemSchema).max(20),
  laborCandidates: z.array(projectDocumentLaborCandidateSchema).max(80),
  materialCandidates: z.array(projectDocumentMaterialCandidateSchema).max(120),
  missingInformation: z.array(z.string().trim().min(1).max(300)).max(30),
  overallConfidence: confidenceSchema,
  projectSummary: z.string().trim().min(1).max(1200),
});

export type ProjectDocumentAnalysisOutput = z.infer<
  typeof projectDocumentAnalysisOutputSchema
>;
