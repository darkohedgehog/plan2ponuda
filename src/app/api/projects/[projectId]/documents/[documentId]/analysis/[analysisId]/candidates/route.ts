import { NextResponse } from "next/server";

import { requireApiVerifiedUser } from "@/lib/auth/guards";
import { saveProjectDocumentCandidateReviewSchema } from "@/lib/validations/project-document-candidate.schema";
import { projectIdSchema } from "@/lib/validations/project.schema";
import {
  getDocumentCandidates,
  saveDocumentCandidateReview,
} from "@/server/services/project-document-candidate-service";
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
