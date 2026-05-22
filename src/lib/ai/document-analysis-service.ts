import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { getOpenAiClient, type AiProvider } from "@/lib/ai/client";
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

const DOCUMENT_ANALYSIS_INSTRUCTIONS = [
  "You extract electrical project documentation from uploaded PDFs.",
  "Return candidates for later human review, not a final verified quote.",
  "Do not merge, price, or overwrite any existing quote, material, or labor data.",
  "Classify detected systems and material categories using only the allowed enum values.",
  "Do not invent exact quantities when the documentation is unclear.",
  "When a quantity is uncertain, set quantity to null and explain the uncertainty in notes.",
  "Use sourceReference for visible page, section, table, drawing, or note labels when available.",
  "List assumptions separately from missing information.",
  "Keep confidence values between 0 and 1.",
].join(" ");

export async function runProjectDocumentAnalysis(
  input: RunProjectDocumentAnalysisInput,
): Promise<RunProjectDocumentAnalysisResult> {
  const openAi = getOpenAiClient();

  if (!openAi.ok) {
    return openAi;
  }

  try {
    const response = await openAi.client.responses.parse({
      input: [
        {
          content: DOCUMENT_ANALYSIS_INSTRUCTIONS,
          role: "developer",
        },
        {
          content: [
            {
              text: "Analyze this electrical project documentation PDF and return structured extraction candidates only.",
              type: "input_text",
            },
            createProjectDocumentInputContent(input.document),
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

function createProjectDocumentInputContent(document: DocumentPdfInput) {
  return {
    detail: "high" as const,
    file_data: document.bytes.toString("base64"),
    filename: document.fileName,
    type: "input_file" as const,
  };
}
