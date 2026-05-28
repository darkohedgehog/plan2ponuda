import "server-only";

import type {
  Prisma,
  ProjectDocument as DbProjectDocument,
  ProjectDocumentAnalysis as DbProjectDocumentAnalysis,
} from "../../../generated/prisma/client";

import type { Locale } from "@/i18n/routing";
import {
  runProjectDocumentAnalysis,
  type RunProjectDocumentAnalysisResult,
} from "@/lib/ai/document-analysis-service";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES,
  PROJECT_DOCUMENT_MIME_TYPE,
} from "@/lib/validations/project-document.schema";
import { projectDocumentAnalysisOutputSchema } from "@/lib/validations/project-document-analysis.schema";
import * as billingService from "@/server/services/billing-service";
import { buildProjectDocumentCandidateCreateInputs } from "@/server/services/project-document-candidate-builders";
import { ensureCandidatesForAnalysis } from "@/server/services/project-document-candidate-service";
import { assertProjectOwnedStoragePath } from "@/server/services/project-storage-paths";
import type {
  AnalyzeProjectDocumentResponse,
  ProjectDocument,
  ProjectDocumentAnalysis,
  ProjectDocumentAnalysisResult,
  ProjectDocumentError,
} from "@/types/project-document";

const PROJECT_FILES_BUCKET = "project-files";

type AnalyzeProjectDocumentFailureReason =
  | "ai_failed"
  | "analysis_failed"
  | "analysis_in_progress"
  | "analysis_limit_reached"
  | "file_too_large"
  | "invalid_storage_path"
  | "not_found"
  | "pro_plan_required"
  | "server_error"
  | "storage_download_failed"
  | "unsupported_file_type";

type AnalyzeProjectDocumentResult =
  | {
      analysis: ProjectDocumentAnalysis;
      document: ProjectDocument;
      ok: true;
      reusedExisting: boolean;
    }
  | {
      ok: false;
      reason: AnalyzeProjectDocumentFailureReason;
    };

type DbProjectDocumentWithAnalyses = DbProjectDocument & {
  analyses: DbProjectDocumentAnalysis[];
};

type ProjectDocumentPdf = {
  bytes: Buffer;
  fileName: string;
  mimeType: "application/pdf";
};

type ProjectDocumentStorageReadResult =
  | {
      file: ProjectDocumentPdf;
      ok: true;
    }
  | {
      ok: false;
      reason:
        | "file_too_large"
        | "invalid_storage_path"
        | "storage_download_failed"
        | "unsupported_file_type";
    };

const SAFE_ANALYSIS_ERROR_MESSAGES: Record<
  Exclude<
    AnalyzeProjectDocumentFailureReason,
    "analysis_in_progress" | "not_found" | "pro_plan_required"
  >,
  string
> = {
  ai_failed: "The AI provider could not analyze this project document.",
  analysis_failed: "The project document analysis failed.",
  analysis_limit_reached: "The large PDF analysis limit has been reached.",
  file_too_large: "Project documentation PDFs must be 20MB or smaller.",
  invalid_storage_path: "The project document storage path is invalid.",
  server_error: "Unable to save project document analysis.",
  storage_download_failed: "Unable to read the uploaded project document.",
  unsupported_file_type: "Only PDF project documents can be analyzed.",
};

export function mapProjectDocumentAnalysis(
  analysis: DbProjectDocumentAnalysis,
): ProjectDocumentAnalysis {
  return {
    createdAt: analysis.createdAt,
    errorMessage: analysis.errorMessage,
    id: analysis.id,
    model: analysis.model,
    parsedResponse: parseProjectDocumentAnalysisResult(
      analysis.parsedResponseJson,
    ),
    projectDocumentId: analysis.projectDocumentId,
    provider: analysis.provider,
    status: analysis.status,
    updatedAt: analysis.updatedAt,
  };
}

async function persistSuccessfulProjectDocumentAnalysis(params: {
  analysisId: string;
  documentId: string;
  model: string;
  parsedResponse: ProjectDocumentAnalysisResult;
  projectId: string;
  provider: string;
  rawResponseJson: unknown;
  userId: string;
}): Promise<{
  analysis: ProjectDocumentAnalysis;
  document: ProjectDocument;
}> {
  const completed = await prisma.$transaction(async (transaction) => {
    await billingService.consumeUsageOrThrow(
      transaction,
      params.userId,
      "large_pdf_analyses_used",
    );

    const analysis = await transaction.projectDocumentAnalysis.update({
      data: {
        errorMessage: null,
        model: params.model,
        parsedResponseJson: toPrismaJson(params.parsedResponse),
        provider: params.provider,
        rawResponseJson: toPrismaJson(params.rawResponseJson),
        status: "completed",
      },
      where: {
        id: params.analysisId,
      },
    });
    const candidateCreateInputs = buildProjectDocumentCandidateCreateInputs(
      analysis.id,
      params.parsedResponse,
    );

    if (candidateCreateInputs.length > 0) {
      await transaction.projectDocumentCandidate.createMany({
        data: candidateCreateInputs,
        skipDuplicates: true,
      });
    }

    const document = await transaction.projectDocument.update({
      data: {
        status: "analyzed",
      },
      include: {
        analyses: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      where: {
        id: params.documentId,
        projectId: params.projectId,
      },
    });

    return {
      analysis,
      document,
    };
  });

  return {
    analysis: mapProjectDocumentAnalysis(completed.analysis),
    document: mapProjectDocumentWithAnalysis(completed.document),
  };
}

async function markProjectDocumentAnalysisFailed(
  analysisId: string,
  documentId: string,
  reason: Exclude<
    AnalyzeProjectDocumentFailureReason,
    "analysis_in_progress" | "not_found" | "pro_plan_required"
  >,
): Promise<void> {
  await prisma.$transaction([
    prisma.projectDocumentAnalysis.update({
      data: {
        errorMessage: SAFE_ANALYSIS_ERROR_MESSAGES[reason],
        status: "failed",
      },
      where: {
        id: analysisId,
      },
    }),
    prisma.projectDocument.update({
      data: {
        status: "failed",
      },
      where: {
        id: documentId,
      },
    }),
  ]);
}

export async function analyzeProjectDocument(
  projectId: string,
  documentId: string,
  userId: string,
  locale: Locale,
): Promise<AnalyzeProjectDocumentResult> {
  const effectivePlan = await billingService.getEffectivePlan(userId);

  if (effectivePlan !== "pro") {
    return {
      ok: false,
      reason: "pro_plan_required",
    };
  }

  const document = await getDocumentForAnalysis(projectId, documentId, userId);

  if (!document) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  const completedAnalysis = document.analyses.find(
    (analysis) => analysis.status === "completed",
  );

  if (completedAnalysis) {
    // already_analyzed: return the existing result without re-running AI or
    // consuming another large_pdf_analyses_used counter.
    // TODO: Add an explicit re-analysis flow if existing results need localization.
    await ensureCandidatesForAnalysis(completedAnalysis.id);

    return {
      analysis: mapProjectDocumentAnalysis(completedAnalysis),
      document: mapProjectDocumentWithAnalysis(document),
      ok: true,
      reusedExisting: true,
    };
  }

  if (document.status === "analyzing") {
    return {
      ok: false,
      reason: "analysis_in_progress",
    };
  }

  const access = await billingService.canUseFeature(userId, "largePdfAnalyses");

  if (!access.allowed) {
    return {
      ok: false,
      reason: "analysis_limit_reached",
    };
  }

  const pdf = await readProjectDocumentPdfFromStorage(document);

  if (!pdf.ok) {
    return {
      ok: false,
      reason: pdf.reason,
    };
  }

  const pendingAnalysis = await createPendingProjectDocumentAnalysis(
    document.id,
  );

  if (!pendingAnalysis) {
    const refreshedDocument = await getDocumentForAnalysis(
      projectId,
      documentId,
      userId,
    );
    const existingCompleted = refreshedDocument?.analyses.find(
      (analysis) => analysis.status === "completed",
    );

    if (refreshedDocument && existingCompleted) {
      await ensureCandidatesForAnalysis(existingCompleted.id);

      return {
        analysis: mapProjectDocumentAnalysis(existingCompleted),
        document: mapProjectDocumentWithAnalysis(refreshedDocument),
        ok: true,
        reusedExisting: true,
      };
    }

    return {
      ok: false,
      reason: "analysis_in_progress",
    };
  }

  const aiAnalysis = await runProjectDocumentAnalysis({
    document: pdf.file,
    documentId: document.id,
    locale,
    projectId: document.projectId,
  });

  if (!aiAnalysis.ok) {
    const failureReason = getFailureReasonForAiResult(aiAnalysis);

    await markProjectDocumentAnalysisFailed(
      pendingAnalysis.id,
      document.id,
      failureReason,
    );

    return {
      ok: false,
      reason: failureReason,
    };
  }

  const parsedResponse = projectDocumentAnalysisOutputSchema.safeParse(
    aiAnalysis.parsedResponse,
  );

  if (!parsedResponse.success) {
    console.error("Validated AI response failed document analysis schema", {
      analysisId: pendingAnalysis.id,
      documentId: document.id,
      issues: parsedResponse.error.issues,
      projectId: document.projectId,
    });
    await markProjectDocumentAnalysisFailed(
      pendingAnalysis.id,
      document.id,
      "ai_failed",
    );

    return {
      ok: false,
      reason: "ai_failed",
    };
  }

  try {
    const persisted = await persistSuccessfulProjectDocumentAnalysis({
      analysisId: pendingAnalysis.id,
      documentId: document.id,
      model: aiAnalysis.model,
      parsedResponse: parsedResponse.data,
      projectId: document.projectId,
      provider: aiAnalysis.provider,
      rawResponseJson: aiAnalysis.rawResponseJson,
      userId,
    });

    return {
      ...persisted,
      ok: true,
      reusedExisting: false,
    };
  } catch (error) {
    if (error instanceof billingService.UsageLimitExceededError) {
      await markProjectDocumentAnalysisFailed(
        pendingAnalysis.id,
        document.id,
        "analysis_limit_reached",
      );

      return {
        ok: false,
        reason: "analysis_limit_reached",
      };
    }

    console.error("Persisting project document analysis failed", error);
    await markProjectDocumentAnalysisFailed(
      pendingAnalysis.id,
      document.id,
      "server_error",
    );

    return {
      ok: false,
      reason: "server_error",
    };
  }
}

export function createAnalyzeProjectDocumentResponse(
  result: AnalyzeProjectDocumentResult,
): AnalyzeProjectDocumentResponse {
  if (!result.ok) {
    return {
      error: createProjectDocumentAnalysisError(result.reason),
      ok: false,
    };
  }

  return {
    analysis: result.analysis,
    document: result.document,
    ok: true,
    reusedExisting: result.reusedExisting,
  };
}

export function createProjectDocumentAnalysisError(
  reason: AnalyzeProjectDocumentFailureReason,
): ProjectDocumentError {
  return {
    code: getPublicProjectDocumentAnalysisErrorCode(reason),
    message: getSafeProjectDocumentAnalysisErrorMessage(reason),
  };
}

export function getProjectDocumentAnalysisErrorStatus(
  reason: AnalyzeProjectDocumentFailureReason,
): number {
  switch (reason) {
    case "file_too_large":
      return 413;
    case "invalid_storage_path":
    case "unsupported_file_type":
      return 400;
    case "not_found":
      return 404;
    case "analysis_in_progress":
      return 409;
    case "analysis_limit_reached":
    case "pro_plan_required":
      return 403;
    case "ai_failed":
    case "analysis_failed":
    case "server_error":
    case "storage_download_failed":
      return 500;
  }
}

async function getDocumentForAnalysis(
  projectId: string,
  documentId: string,
  userId: string,
): Promise<DbProjectDocumentWithAnalyses | null> {
  return prisma.projectDocument.findFirst({
    include: {
      analyses: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    where: {
      id: documentId,
      projectId,
      project: {
        userId,
      },
    },
  });
}

async function createPendingProjectDocumentAnalysis(
  documentId: string,
): Promise<{ id: string } | null> {
  return prisma.$transaction(async (transaction) => {
    const statusUpdate = await transaction.projectDocument.updateMany({
      data: {
        status: "analyzing",
      },
      where: {
        id: documentId,
        status: {
          in: ["analysis_pending", "failed", "uploaded"],
        },
      },
    });

    if (statusUpdate.count !== 1) {
      return null;
    }

    return transaction.projectDocumentAnalysis.create({
      data: {
        projectDocumentId: documentId,
        provider: "openai",
        status: "analyzing",
      },
      select: {
        id: true,
      },
    });
  });
}

async function readProjectDocumentPdfFromStorage(
  document: DbProjectDocumentWithAnalyses,
): Promise<ProjectDocumentStorageReadResult> {
  if (document.mimeType !== PROJECT_DOCUMENT_MIME_TYPE) {
    return {
      ok: false,
      reason: "unsupported_file_type",
    };
  }

  if (document.sizeBytes > MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      ok: false,
      reason: "file_too_large",
    };
  }

  let filePath: string;

  try {
    filePath = assertProjectOwnedStoragePath(document.projectId, document.filePath);
  } catch (error) {
    console.error("Invalid project document storage path", error);

    return {
      ok: false,
      reason: "invalid_storage_path",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .download(filePath);

    if (error || !data) {
      console.error("Project document storage download failed", error);

      return {
        ok: false,
        reason: "storage_download_failed",
      };
    }

    const bytes = Buffer.from(await data.arrayBuffer());

    if (bytes.length > MAX_PROJECT_DOCUMENT_FILE_SIZE_BYTES) {
      return {
        ok: false,
        reason: "file_too_large",
      };
    }

    return {
      file: {
        bytes,
        fileName: document.fileName,
        mimeType: PROJECT_DOCUMENT_MIME_TYPE,
      },
      ok: true,
    };
  } catch (error) {
    console.error("Project document storage download failed", error);

    return {
      ok: false,
      reason: "storage_download_failed",
    };
  }
}

function mapProjectDocumentWithAnalysis(
  document: DbProjectDocumentWithAnalyses,
): ProjectDocument {
  const latestAnalysis = document.analyses.at(0);

  return {
    createdAt: document.createdAt,
    fileName: document.fileName,
    filePath: document.filePath,
    id: document.id,
    latestAnalysis: latestAnalysis
      ? mapProjectDocumentAnalysis(latestAnalysis)
      : null,
    mimeType: document.mimeType,
    projectId: document.projectId,
    sizeBytes: document.sizeBytes,
    status: document.status,
    updatedAt: document.updatedAt,
  };
}

function parseProjectDocumentAnalysisResult(
  value: Prisma.JsonValue | null,
): ProjectDocumentAnalysisResult | null {
  if (value === null) {
    return null;
  }

  const parsed = projectDocumentAnalysisOutputSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

function getFailureReasonForAiResult(
  result: Extract<RunProjectDocumentAnalysisResult, { ok: false }>,
): "ai_failed" | "analysis_failed" {
  switch (result.reason) {
    case "malformed_ai_response":
    case "provider_error":
      return "ai_failed";
    case "missing_api_key":
      return "analysis_failed";
  }
}

function getPublicProjectDocumentAnalysisErrorCode(
  reason: AnalyzeProjectDocumentFailureReason,
): ProjectDocumentError["code"] {
  switch (reason) {
    case "analysis_limit_reached":
    case "file_too_large":
    case "invalid_storage_path":
    case "not_found":
    case "pro_plan_required":
    case "storage_download_failed":
    case "unsupported_file_type":
      return reason;
    case "analysis_in_progress":
      return "analysis_in_progress";
    case "ai_failed":
    case "analysis_failed":
    case "server_error":
      return "analysis_failed";
  }
}

function getSafeProjectDocumentAnalysisErrorMessage(
  reason: AnalyzeProjectDocumentFailureReason,
): string {
  switch (reason) {
    case "analysis_in_progress":
      return "This project document is already being analyzed.";
    case "analysis_limit_reached":
      return "Large PDF analysis limit reached.";
    case "file_too_large":
      return "Project documentation PDFs must be 20MB or smaller.";
    case "invalid_storage_path":
      return "Invalid project document.";
    case "not_found":
      return "Project document not found.";
    case "pro_plan_required":
      return "A Pro plan is required to analyze project documentation.";
    case "storage_download_failed":
      return "Unable to read the project document.";
    case "unsupported_file_type":
      return "Only PDF project documents can be analyzed.";
    case "ai_failed":
    case "analysis_failed":
    case "server_error":
      return "Unable to analyze this project document.";
  }
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
