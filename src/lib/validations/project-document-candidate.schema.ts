import { z } from "zod";

export const projectDocumentCandidateStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
]);

const editableDecimalSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(999999.999);

const nullableEditableTextSchema = z
  .string()
  .trim()
  .max(1000)
  .nullable()
  .optional();

export const saveProjectDocumentCandidateReviewSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({
            category: z.string().trim().min(1).max(80).nullable().optional(),
            description: nullableEditableTextSchema,
            id: z.string().min(1),
            name: z.string().trim().min(1).max(160),
            notes: nullableEditableTextSchema,
            quantity: editableDecimalSchema.nullable().optional(),
            status: projectDocumentCandidateStatusSchema,
            unit: z.string().trim().min(1).max(20),
            unitPrice: editableDecimalSchema.nullable().optional(),
          })
          .strict(),
      )
      .max(200),
  })
  .strict();

export type SaveProjectDocumentCandidateReviewInput = z.infer<
  typeof saveProjectDocumentCandidateReviewSchema
>;
