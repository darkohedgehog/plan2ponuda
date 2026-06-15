import { NextResponse } from "next/server";

import { requireApiVerifiedUser } from "@/lib/auth/guards";
import { saveProjectDocumentCandidateReviewSchema } from "@/lib/validations/project-document-candidate.schema";
import { projectIdSchema } from "@/lib/validations/project.schema";
import {
  getDocumentCandidates,
  saveDocumentCandidateReview,
} from "@/server/services/project-document-candidate-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type {
  ProjectDocumentCandidatesResponse,
  ProjectDocumentError,
} from "@/types/project-document";

type ProjectDocumentCandidateRouteContext = {
  params: Promise<{
    analysisId: string;
    documentId: string;
    projectId: string;
  }>;
};

const invalidInputError: ProjectDocumentError = {
  code: "invalid_input",
  message: "Invalid project document candidates.",
};

function getCandidateRouteErrorStatus(reason: string): number {
  switch (reason) {
    case "not_found":
      return 404;
    case "invalid_candidate_input":
    case "invalid_candidate_reference":
      return 400;
    default:
      return 500;
  }
}

function createCandidateRouteError(reason: string): ProjectDocumentError {
  switch (reason) {
    case "not_found":
      return {
        code: "not_found",
        message: "Project document analysis was not found.",
      };
    case "invalid_candidate_input":
    case "invalid_candidate_reference":
      return invalidInputError;
    default:
      return {
        code: "server_error",
        message: "Unable to load project document candidates.",
      };
  }
}

function createCandidateReviewRateLimitKey({
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

export async function GET(
  _request: Request,
  context: ProjectDocumentCandidateRouteContext,
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
    const response: ProjectDocumentCandidatesResponse = {
      error: invalidInputError,
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  const result = await getDocumentCandidates(
    parsedParams.data.projectId,
    parsedParams.data.documentId,
    parsedParams.data.analysisId,
    auth.user.id,
  ).catch((error: unknown) => {
    console.error("Project document candidates fetch failed", error);

    return {
      ok: false as const,
      reason: "server_error" as const,
    };
  });

  if (!result.ok) {
    const response: ProjectDocumentCandidatesResponse = {
      error: createCandidateRouteError(result.reason),
      ok: false,
    };

    return NextResponse.json(response, {
      status: getCandidateRouteErrorStatus(result.reason),
    });
  }

  return NextResponse.json({
    candidates: result.candidates,
    ok: true,
  });
}

export async function PUT(
  request: Request,
  context: ProjectDocumentCandidateRouteContext,
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
    const response: ProjectDocumentCandidatesResponse = {
      error: invalidInputError,
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    await checkRateLimitOrThrow({
      key: createCandidateReviewRateLimitKey({
        analysisId: parsedParams.data.analysisId,
        projectId: parsedParams.data.projectId,
        userId: auth.user.id,
      }),
      scope: RATE_LIMIT_SCOPES.projectDocumentCandidateReview,
      ...RATE_LIMIT_POLICIES.projectDocumentCandidateReview,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: ProjectDocumentCandidatesResponse = {
        error: {
          code: "rate_limited",
          message: "Too many candidate review requests. Please try again later.",
        },
        ok: false,
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    console.error("Project document candidate review rate limit failed", error);

    const response: ProjectDocumentCandidatesResponse = {
      error: {
        code: "server_error",
        message: "Unable to save project document candidates.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = saveProjectDocumentCandidateReviewSchema.safeParse(body);

  if (!parsedInput.success) {
    const response: ProjectDocumentCandidatesResponse = {
      error: invalidInputError,
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  const result = await saveDocumentCandidateReview(
    parsedParams.data.projectId,
    parsedParams.data.documentId,
    parsedParams.data.analysisId,
    auth.user.id,
    parsedInput.data,
  ).catch((error: unknown) => {
    console.error("Project document candidate review save failed", error);

    return {
      ok: false as const,
      reason: "server_error" as const,
    };
  });

  if (!result.ok) {
    const response: ProjectDocumentCandidatesResponse = {
      error: createCandidateRouteError(result.reason),
      ok: false,
    };

    return NextResponse.json(response, {
      status: getCandidateRouteErrorStatus(result.reason),
    });
  }

  return NextResponse.json({
    candidates: result.candidates,
    ok: true,
  });
}
