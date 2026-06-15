import { NextResponse } from "next/server";

import { requireApiVerifiedUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { importAcceptedDocumentCandidatesToQuote } from "@/server/services/project-document-candidate-import-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type {
  ImportProjectDocumentCandidatesResponse,
  ProjectDocumentError,
} from "@/types/project-document";

type ProjectDocumentCandidateImportRouteContext = {
  params: Promise<{
    analysisId: string;
    documentId: string;
    projectId: string;
  }>;
};

const invalidInputError: ProjectDocumentError = {
  code: "invalid_input",
  message: "Invalid project document import request.",
};

function getImportRouteErrorStatus(reason: string): number {
  switch (reason) {
    case "not_found":
      return 404;
    case "pro_plan_required":
    case "quote_limit_reached":
      return 403;
    case "no_accepted_materials":
      return 400;
    default:
      return 500;
  }
}

function createImportRouteError(reason: string): ProjectDocumentError {
  switch (reason) {
    case "not_found":
      return {
        code: "not_found",
        message: "Project document analysis was not found.",
      };
    case "pro_plan_required":
      return {
        code: "pro_plan_required",
        message: "Pro plan required.",
      };
    case "quote_limit_reached":
      return {
        code: "quote_limit_reached",
        message: "You have reached your quote limit for this plan.",
      };
    case "no_accepted_materials":
      return {
        code: "no_accepted_materials",
        message: "No accepted materials to import.",
      };
    default:
      return {
        code: "server_error",
        message: "Unable to import document candidates.",
      };
  }
}

function createCandidateImportRateLimitKey({
  analysisId,
  projectId,
  userId,
}: {
  analysisId: string;
  projectId: string;
  userId: string;
}): string {
  return `${createUserRateLimitKey({ userId })}:project:${projectId}:analysis:${analysisId}`;
}

export async function POST(
  _request: Request,
  context: ProjectDocumentCandidateImportRouteContext,
) {
  const auth = await requireApiVerifiedUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = projectIdSchema
    .extend({
      analysisId: projectIdSchema.shape.projectId,
      documentId: projectIdSchema.shape.projectId,
    })
    .safeParse(await context.params);

  if (!parsedParams.success) {
    const response: ImportProjectDocumentCandidatesResponse = {
      error: invalidInputError,
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    await checkRateLimitOrThrow({
      key: createCandidateImportRateLimitKey({
        analysisId: parsedParams.data.analysisId,
        projectId: parsedParams.data.projectId,
        userId: auth.user.id,
      }),
      scope: RATE_LIMIT_SCOPES.projectDocumentCandidateImport,
      ...RATE_LIMIT_POLICIES.projectDocumentCandidateImport,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: ImportProjectDocumentCandidatesResponse = {
        error: {
          code: "rate_limited",
          message: "Too many candidate import requests. Please try again later.",
        },
        ok: false,
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    console.error("Project document candidate import rate limit failed", error);

    const response: ImportProjectDocumentCandidatesResponse = {
      error: {
        code: "server_error",
        message: "Unable to import document candidates.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const result = await importAcceptedDocumentCandidatesToQuote(
    parsedParams.data.projectId,
    parsedParams.data.documentId,
    parsedParams.data.analysisId,
    auth.user.id,
  ).catch((error: unknown) => {
    console.error("Project document candidate import failed", error);

    return {
      ok: false as const,
      reason: "server_error" as const,
    };
  });

  if (!result.ok) {
    const response: ImportProjectDocumentCandidatesResponse = {
      error: createImportRouteError(result.reason),
      ok: false,
    };

    return NextResponse.json(response, {
      status: getImportRouteErrorStatus(result.reason),
    });
  }

  return NextResponse.json({
    alreadyImportedCount: result.alreadyImportedCount,
    importedLaborCount: result.importedLaborCount,
    importedMaterialsCount: result.importedMaterialsCount,
    laborSkippedCount: result.laborSkippedCount,
    ok: true,
    quoteId: result.quoteId,
    skippedCount: result.skippedCount,
  });
}
