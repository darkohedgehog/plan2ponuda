import { z } from "zod";

export const MAX_FLOOR_PLAN_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FLOOR_PLAN_UPLOAD_BODY_SIZE_BYTES =
  MAX_FLOOR_PLAN_FILE_SIZE_BYTES + 1024 * 1024;

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

export type ValidatedFloorPlanFileUpload = {
  extension: "jpg" | "pdf" | "png";
  mimeType: AllowedFloorPlanMimeType;
  ok: true;
};

export type FloorPlanFileUploadValidationResult =
  | ValidatedFloorPlanFileUpload
  | {
      error: FloorPlanFileValidationError;
      ok: false;
    };

const FLOOR_PLAN_UNSUPPORTED_FILE_ERROR: FloorPlanFileValidationError = {
  code: "unsupported_file_type",
  message: "Upload a PDF, PNG, JPG, or JPEG floor plan.",
};
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;
const PNG_SIGNATURE = [
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
] as const;
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const SIGNATURE_BYTES_TO_READ = 8;

export const projectStatusSchema = z.enum([
  "draft",
  "uploaded",
  "analyzing",
  "reviewed",
  "quoted",
  "failed",
]);

export const objectTypeSchema = z.enum(["apartment", "house", "office"]);

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    clientName: z.string().trim().min(1).max(120).optional(),
    objectType: objectTypeSchema,
    areaM2: z.number().positive(),
  })
  .strip();

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

function getFloorPlanMimeTypeForFileName(
  fileName: string,
): AllowedFloorPlanMimeType | null {
  switch (getFileNameExtension(fileName)) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    default:
      return null;
  }
}

async function detectFloorPlanFileType(
  file: File,
): Promise<ValidatedFloorPlanFileUpload | null> {
  const bytes = new Uint8Array(
    await file.slice(0, SIGNATURE_BYTES_TO_READ).arrayBuffer(),
  );

  if (startsWithBytes(bytes, PDF_SIGNATURE)) {
    return {
      extension: "pdf",
      mimeType: "application/pdf",
      ok: true,
    };
  }

  if (startsWithBytes(bytes, PNG_SIGNATURE)) {
    return {
      extension: "png",
      mimeType: "image/png",
      ok: true,
    };
  }

  if (startsWithBytes(bytes, JPEG_SIGNATURE)) {
    return {
      extension: "jpg",
      mimeType: "image/jpeg",
      ok: true,
    };
  }

  return null;
}

function getFileNameExtension(fileName: string): string | null {
  const safeName = fileName.trim().split(/[\\/]/).filter(Boolean).at(-1) ?? "";
  const dotIndex = safeName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === safeName.length - 1) {
    return null;
  }

  return safeName.slice(dotIndex + 1).toLowerCase();
}

function startsWithBytes(
  bytes: Uint8Array,
  signature: ReadonlyArray<number>,
): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((byte, index) => bytes[index] === byte);
}

export function validateFloorPlanFile(
  file: File,
): FloorPlanFileValidationError | null {
  if (!isAllowedFloorPlanMimeType(file.type)) {
    return FLOOR_PLAN_UNSUPPORTED_FILE_ERROR;
  }

  if (file.size > MAX_FLOOR_PLAN_FILE_SIZE_BYTES) {
    return {
      code: "file_too_large",
      message: "Floor plan files must be 10MB or smaller.",
    };
  }

  return null;
}

export async function validateFloorPlanFileUpload(
  file: File,
): Promise<FloorPlanFileUploadValidationResult> {
  const validationError = validateFloorPlanFile(file);

  if (validationError) {
    return {
      error: validationError,
      ok: false,
    };
  }

  const detectedType = await detectFloorPlanFileType(file);
  const fileNameMimeType = getFloorPlanMimeTypeForFileName(file.name);

  if (
    !detectedType ||
    file.type !== detectedType.mimeType ||
    fileNameMimeType !== detectedType.mimeType
  ) {
    return {
      error: FLOOR_PLAN_UNSUPPORTED_FILE_ERROR,
      ok: false,
    };
  }

  return {
    extension: getFloorPlanFileExtension(detectedType.mimeType),
    mimeType: detectedType.mimeType,
    ok: true,
  };
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
