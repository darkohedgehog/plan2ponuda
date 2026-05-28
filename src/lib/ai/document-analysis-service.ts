import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { getOpenAiClient, type AiProvider } from "@/lib/ai/client";
import {
  OPENAI_PDF_FILE_DATA_PREFIX,
  buildProjectDocumentOpenAiFileInput,
  validateProjectDocumentPdfForOpenAi,
  type ProjectDocumentOpenAiFileInput,
} from "@/lib/ai/document-file-input";
import {
  MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES,
  PROJECT_DOCUMENT_MIME_TYPE,
} from "@/lib/validations/project-document.schema";
import {
  projectDocumentAnalysisOutputSchema,
  type ProjectDocumentAnalysisOutput,
} from "@/lib/validations/project-document-analysis.schema";

type DocumentPdfInput = {
  bytes: Buffer;
  fileName: string;
  mimeType: "application/pdf";
};

export type RunProjectDocumentAnalysisInput = {
  document: DocumentPdfInput;
  documentId: string;
  locale: Locale;
  projectId: string;
};

export type RunProjectDocumentAnalysisResult =
  | {
      model: string;
      ok: true;
      parsedResponse: ProjectDocumentAnalysisOutput;
      provider: AiProvider;
      rawResponseJson: unknown;
    }
  | {
      ok: false;
      reason: "malformed_ai_response" | "missing_api_key" | "provider_error";
    };

const DOCUMENT_ANALYSIS_LANGUAGE_NAMES: Record<Locale, string> = {
  de: "German",
  en: "English",
  hr: "Croatian",
  sl: "Slovenian",
  sr: "Serbian Latin",
};

const BASE_DOCUMENT_ANALYSIS_INSTRUCTIONS = [
  "You extract electrical project documentation from uploaded PDFs.",
  "Return candidates for later human review, not a final verified quote.",
  "Do not merge, price, or overwrite any existing quote, material, or labor data.",
  "Classify detected systems and material categories using only the allowed enum values.",
  "Do not invent exact quantities when the documentation is unclear.",
  "When a quantity is uncertain, set quantity to null and explain the uncertainty in notes.",
  "Use sourceReference for visible page, section, table, drawing, or note labels when available.",
  "List assumptions separately from missing information.",
  "Keep confidence values between 0 and 1.",
];

function getDocumentAnalysisInstructions(locale: Locale): string {
  const languageName = DOCUMENT_ANALYSIS_LANGUAGE_NAMES[locale];

  return [
    ...BASE_DOCUMENT_ANALYSIS_INSTRUCTIONS,
    `Write all user-facing text fields in ${languageName}. This includes projectSummary, candidate name, description, notes, assumptions, and missingInformation.`,
    "Keep technical codes, product identifiers, visible labels, and document references unchanged when translation would make them less accurate.",
    "Keep schema enum values unchanged: material categories, units, detectedSystems, candidate type/status, and other internal enum values must remain in the schema's English enum format.",
    "Source references can remain as page, section, table, drawing, or note references from the document.",
  ].join(" ");
}

export async function runProjectDocumentAnalysis(
  input: RunProjectDocumentAnalysisInput,
): Promise<RunProjectDocumentAnalysisResult> {
  const validatedDocument = validateProjectDocumentPdfForOpenAi({
    bytes: input.document.bytes,
    fileName: input.document.fileName,
    maxSizeBytes: MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES,
    mimeType: input.document.mimeType,
  });

  if (!validatedDocument.ok) {
    console.error("Invalid project document PDF input for OpenAI analysis", {
      documentId: input.documentId,
      fileName: input.document.fileName,
      mimeType: input.document.mimeType,
      projectId: input.projectId,
      reason: validatedDocument.reason,
      sizeBytes: input.document.bytes.length,
    });

    return {
      ok: false,
      reason: "provider_error",
    };
  }

  const inputFile = buildProjectDocumentOpenAiFileInput({
    bytes: input.document.bytes,
    fileName: input.document.fileName,
    maxSizeBytes: MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES,
    mimeType: input.document.mimeType,
  });

  logProjectDocumentInputMetadata(input.document, inputFile);

  const openAi = getOpenAiClient();

  if (!openAi.ok) {
    return openAi;
  }

  try {
    const response = await openAi.client.responses.parse({
      input: [
        {
          content: getDocumentAnalysisInstructions(input.locale),
          role: "developer",
        },
        {
          content: [
            {
              text: "Analyze this electrical project documentation PDF and return structured extraction candidates only.",
              type: "input_text",
            },
            inputFile,
          ],
          role: "user",
        },
      ],
      model: openAi.config.analysisModel,
      safety_identifier: `${input.projectId}:${input.documentId}`.slice(0, 64),
      store: false,
      text: {
        format: zodTextFormat(
          projectDocumentAnalysisOutputSchema,
          "project_document_analysis",
        ),
      },
    });

    if (!response.output_parsed) {
      return {
        ok: false,
        reason: "malformed_ai_response",
      };
    }

    const parsedResponse = projectDocumentAnalysisOutputSchema.parse(
      response.output_parsed,
    );

    return {
      model: openAi.config.analysisModel,
      ok: true,
      parsedResponse,
      provider: openAi.config.provider,
      rawResponseJson: {
        id: response.id,
        model: response.model,
        outputText: response.output_text,
        status: response.status,
        usage: response.usage,
      },
    };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      console.error(
        "OpenAI project document analysis returned malformed output",
        error,
      );

      return {
        ok: false,
        reason: "malformed_ai_response",
      };
    }

    console.error("OpenAI project document analysis failed", error);

    return {
      ok: false,
      reason: "provider_error",
    };
  }
}

function logProjectDocumentInputMetadata(
  document: DocumentPdfInput,
  inputFile: ProjectDocumentOpenAiFileInput,
): void {
  const hasPdfDataUrl = inputFile.file_data.startsWith(
    OPENAI_PDF_FILE_DATA_PREFIX,
  );

  if (process.env.NODE_ENV !== "production") {
    console.info("Prepared OpenAI project document PDF input", {
      fileName: inputFile.filename,
      hasPdfDataUrl,
      mimeType: PROJECT_DOCUMENT_MIME_TYPE,
      sizeBytes: document.bytes.length,
    });
  }
}
