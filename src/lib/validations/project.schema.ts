import { z } from "zod";

export const MAX_FLOOR_PLAN_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_FLOOR_PLAN_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type AllowedFloorPlanMimeType =
  (typeof ALLOWED_FLOOR_PLAN_MIME_TYPES)[number];

export type FloorPlanFileValidationError = {
  code: "invalid_file" | "unsupported_file_type" | "file_too_large";
  message: string;
};

export const projectStatusSchema = z.enum([
  "draft",
  "uploaded",
  "analyzing",
  "reviewed",
  "quoted",
  "failed",
]);

export const objectTypeSchema = z.enum(["apartment", "house", "office"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(3).max(120),
  clientName: z.string().trim().min(1).max(120).optional(),
  objectType: objectTypeSchema,
  areaM2: z.number().positive(),
  sourceFilePath: z.string().trim().min(1).optional(),
  previewPath: z.string().trim().min(1).optional(),
});

export const projectIdSchema = z.object({
  projectId: z.string().min(1),
});

export function isFileInput(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export function isAllowedFloorPlanMimeType(
  mimeType: string,
): mimeType is AllowedFloorPlanMimeType {
  return ALLOWED_FLOOR_PLAN_MIME_TYPES.some(
    (allowedMimeType) => allowedMimeType === mimeType,
  );
}

export function getFloorPlanFileExtension(
  mimeType: AllowedFloorPlanMimeType,
): "jpg" | "pdf" | "png" {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
  }
}

export function validateFloorPlanFile(
  file: File,
): FloorPlanFileValidationError | null {
  if (!isAllowedFloorPlanMimeType(file.type)) {
    return {
      code: "unsupported_file_type",
      message: "Upload a PDF, PNG, JPG, or JPEG floor plan.",
    };
  }

  if (file.size > MAX_FLOOR_PLAN_FILE_SIZE_BYTES) {
    return {
      code: "file_too_large",
      message: "Floor plan files must be 10MB or smaller.",
    };
  }

  return null;
}

export const floorPlanFileSchema = z
  .custom<File>(isFileInput, {
    message: "Select a floor plan file to upload.",
  })
  .superRefine((file, context) => {
    const error = validateFloorPlanFile(file);

    if (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: error.message,
      });
    }
  });

export const uploadFloorPlanSchema = z.object({
  file: floorPlanFileSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectStatusInput = z.infer<typeof projectStatusSchema>;
export type ObjectTypeInput = z.infer<typeof objectTypeSchema>;
export type UploadFloorPlanInput = z.infer<typeof uploadFloorPlanSchema>;
