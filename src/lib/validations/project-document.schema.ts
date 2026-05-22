import { z } from "zod";

export const MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const PROJECT_DOCUMENT_MIME_TYPE = "application/pdf";

export type ProjectDocumentFileValidationError = {
  code: "file_too_large" | "invalid_file" | "unsupported_file_type";
  message: string;
};

function isFileInput(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export function isAllowedProjectDocumentMimeType(mimeType: string): boolean {
  return mimeType === PROJECT_DOCUMENT_MIME_TYPE;
}

function hasPdfExtension(fileName: string): boolean {
  const trimmedFileName = fileName.trim();

  return (
    trimmedFileName.length === 0 || trimmedFileName.toLowerCase().endsWith(".pdf")
  );
}

export function validateProjectDocumentFile(
  file: File,
): ProjectDocumentFileValidationError | null {
  if (
    !isAllowedProjectDocumentMimeType(file.type) ||
    !hasPdfExtension(file.name)
  ) {
    return {
      code: "unsupported_file_type",
      message: "Upload a PDF project document.",
    };
  }

  if (file.size > MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      code: "file_too_large",
      message: "Project documentation PDFs must be 20MB or smaller.",
    };
  }

  return null;
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
