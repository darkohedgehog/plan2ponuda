export const OPENAI_PDF_FILE_DATA_PREFIX = "data:application/pdf;base64,";

export type ProjectDocumentOpenAiFileInput = {
  detail: "high";
  file_data: string;
  filename: string;
  type: "input_file";
};

export type ProjectDocumentPdfForOpenAi = {
  bytes: Buffer;
  fileName: string;
  maxSizeBytes: number;
  mimeType: string;
};

export type ProjectDocumentPdfValidationResult =
  | {
      base64: string;
      fileName: string;
      ok: true;
      sizeBytes: number;
    }
  | {
      ok: false;
      reason:
        | "empty_base64"
        | "empty_pdf"
        | "file_too_large"
        | "unsupported_file_type";
    };

export function validateProjectDocumentPdfForOpenAi(
  document: ProjectDocumentPdfForOpenAi,
): ProjectDocumentPdfValidationResult {
  if (document.mimeType !== "application/pdf") {
    return {
      ok: false,
      reason: "unsupported_file_type",
    };
  }

  if (document.bytes.length === 0) {
    return {
      ok: false,
      reason: "empty_pdf",
    };
  }

  if (document.bytes.length > document.maxSizeBytes) {
    return {
      ok: false,
      reason: "file_too_large",
    };
  }

  const base64 = document.bytes.toString("base64");

  if (base64.length === 0) {
    return {
      ok: false,
      reason: "empty_base64",
    };
  }

  return {
    base64,
    fileName: normalizePdfFileName(document.fileName),
    ok: true,
    sizeBytes: document.bytes.length,
  };
}

export function buildProjectDocumentOpenAiFileInput(
  document: ProjectDocumentPdfForOpenAi,
): ProjectDocumentOpenAiFileInput {
  const validated = validateProjectDocumentPdfForOpenAi(document);

  if (!validated.ok) {
    throw new Error(`Invalid project document PDF input: ${validated.reason}`);
  }

  return {
    detail: "high",
    file_data: `${OPENAI_PDF_FILE_DATA_PREFIX}${validated.base64}`,
    filename: validated.fileName,
    type: "input_file",
  };
}

function normalizePdfFileName(fileName: string): string {
  const normalizedFileName =
    fileName
      .split(/[\\/]/)
      .filter(Boolean)
      .at(-1)
      ?.replace(/[\u0000-\u001f\u007f]/g, "")
      .trim() ?? "";

  if (
    normalizedFileName.length === 0 ||
    normalizedFileName === "." ||
    normalizedFileName === ".."
  ) {
    return "project-document.pdf";
  }

  return normalizedFileName.toLowerCase().endsWith(".pdf")
    ? normalizedFileName
    : `${normalizedFileName}.pdf`;
}
