import { z } from "zod";

export const MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_PROJECT_DOCUMENT_UPLOAD_BODY_SIZE_BYTES =
  MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES + 1024 * 1024;
export const PROJECT_DOCUMENT_MIME_TYPE = "application/pdf";

export type ProjectDocumentFileValidationError = {
  code: "file_too_large" | "invalid_file" | "unsupported_file_type";
  message: string;
};

export type ValidatedProjectDocumentFileUpload = {
  mimeType: typeof PROJECT_DOCUMENT_MIME_TYPE;
  ok: true;
};

export type ProjectDocumentFileUploadValidationResult =
  | ValidatedProjectDocumentFileUpload
  | {
      error: ProjectDocumentFileValidationError;
      ok: false;
    };

const PROJECT_DOCUMENT_UNSUPPORTED_FILE_ERROR: ProjectDocumentFileValidationError = {
  code: "unsupported_file_type",
  message: "Upload a PDF project document.",
};
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;
const SIGNATURE_BYTES_TO_READ = 5;

function isFileInput(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export function isAllowedProjectDocumentMimeType(mimeType: string): boolean {
  return mimeType === PROJECT_DOCUMENT_MIME_TYPE;
}

function hasPdfExtension(fileName: string): boolean {
  return getFileNameExtension(fileName) === "pdf";
}

async function hasPdfSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(
    await file.slice(0, SIGNATURE_BYTES_TO_READ).arrayBuffer(),
  );

  return startsWithBytes(bytes, PDF_SIGNATURE);
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

export function validateProjectDocumentFile(
  file: File,
): ProjectDocumentFileValidationError | null {
  if (
    !isAllowedProjectDocumentMimeType(file.type) ||
    !hasPdfExtension(file.name)
  ) {
    return PROJECT_DOCUMENT_UNSUPPORTED_FILE_ERROR;
  }

  if (file.size > MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      code: "file_too_large",
      message: "Project documentation PDFs must be 20MB or smaller.",
    };
  }

  return null;
}

export async function validateProjectDocumentFileUpload(
  file: File,
): Promise<ProjectDocumentFileUploadValidationResult> {
  const validationError = validateProjectDocumentFile(file);

  if (validationError) {
    return {
      error: validationError,
      ok: false,
    };
  }

  if (!(await hasPdfSignature(file)) || file.type !== PROJECT_DOCUMENT_MIME_TYPE) {
    return {
      error: PROJECT_DOCUMENT_UNSUPPORTED_FILE_ERROR,
      ok: false,
    };
  }

  return {
    mimeType: PROJECT_DOCUMENT_MIME_TYPE,
    ok: true,
  };
}

export const projectDocumentFileSchema = z
  .custom<File>(isFileInput, {
    message: "Select a project PDF to upload.",
  })
  .superRefine((file, context) => {
    const error = validateProjectDocumentFile(file);

    if (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: error.message,
      });
    }
  });

export const uploadProjectDocumentSchema = z.object({
  file: projectDocumentFileSchema,
});

export type UploadProjectDocumentInput = z.infer<
  typeof uploadProjectDocumentSchema
>;
