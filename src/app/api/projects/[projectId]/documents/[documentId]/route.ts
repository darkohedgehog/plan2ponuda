import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { deleteProjectDocument } from "@/server/services/project-document-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type { DeleteProjectDocumentResponse } from "@/types/project-document";

type ProjectDocumentRouteContext = {
  params: Promise<{
    documentId: string;
    projectId: string;
  }>;
};

function getDeleteErrorStatus(errorCode: string): number {
  switch (errorCode) {
    case "invalid_input":
      return 400;
    case "not_found":
      return 404;
    default:
      return 500;
  }
}

export async function DELETE(
  _request: Request,
  context: ProjectDocumentRouteContext,
) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    await checkRateLimitOrThrow({
      key: createUserRateLimitKey({
        userId: auth.user.id,
      }),
      scope: RATE_LIMIT_SCOPES.projectDocumentDelete,
      ...RATE_LIMIT_POLICIES.projectDocumentDelete,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: DeleteProjectDocumentResponse = {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many document requests. Please try again later.",
        },
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    console.error("Project document delete rate limit failed", error);

    const response: DeleteProjectDocumentResponse = {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to delete project document.",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }

  const params = await context.params;
  const parsedParams = projectIdSchema
    .extend({
      documentId: projectIdSchema.shape.projectId,
    })
    .safeParse(params);

  if (!parsedParams.success) {
    const response: DeleteProjectDocumentResponse = {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Invalid project document id.",
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  const result = await deleteProjectDocument(
    parsedParams.data.projectId,
    parsedParams.data.documentId,
    auth.user.id,
  ).catch((error: unknown): DeleteProjectDocumentResponse => {
    console.error("Project document deletion failed", error);

    return {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to delete project document.",
      },
    };
  });

  if (!result.ok) {
    return NextResponse.json(result, {
      status: getDeleteErrorStatus(result.error.code),
    });
  }

  return NextResponse.json(result);
}
