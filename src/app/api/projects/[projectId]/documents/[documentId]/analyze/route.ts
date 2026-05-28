import { NextResponse } from "next/server";

import { resolveLocale, type Locale } from "@/i18n/routing";
import { requireApiVerifiedUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import {
  analyzeProjectDocument,
  createAnalyzeProjectDocumentResponse,
  getProjectDocumentAnalysisErrorStatus,
} from "@/server/services/project-document-analysis-service";
import {
  createAiRateLimitKey,
  getRateLimitHeaders,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
} from "@/server/services/rate-limit-service";
import type {
  AnalyzeProjectDocumentResponse,
  ProjectDocumentError,
} from "@/types/project-document";

type ProjectDocumentAnalyzeRouteContext = {
  params: Promise<{
    documentId: string;
    projectId: string;
  }>;
};

const invalidInputError: ProjectDocumentError = {
  code: "invalid_input",
  message: "Invalid project document.",
};

export async function POST(
  request: Request,
  context: ProjectDocumentAnalyzeRouteContext,
) {
  const auth = await requireApiVerifiedUser();

  if (!auth.ok) {
    return auth.response;
  }

  const params = await context.params;
  const parsedParams = projectIdSchema
    .extend({
      documentId: projectIdSchema.shape.projectId,
    })
    .safeParse(params);

  if (!parsedParams.success) {
    const response: AnalyzeProjectDocumentResponse = {
      error: invalidInputError,
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  const rateLimit = await checkRateLimitOrThrow({
    key: createAiRateLimitKey({
      userId: auth.user.id,
    }),
    scope: RATE_LIMIT_SCOPES.projectDocumentAnalysis,
    ...RATE_LIMIT_POLICIES.projectDocumentAnalysis,
  }).catch((error: unknown) => {
    if (error instanceof RateLimitExceededError) {
      return error.status;
    }

    console.error("Project document analysis rate limit failed", error);

    return null;
  });

  if (!rateLimit) {
    const response: AnalyzeProjectDocumentResponse = {
      error: {
        code: "server_error",
        message: "Unable to analyze this project document.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.ok) {
    const response: AnalyzeProjectDocumentResponse = {
      error: {
        code: "rate_limited",
        message: "Too many document analysis requests. Please try again later.",
      },
      ok: false,
    };

    return NextResponse.json(response, {
      headers: rateLimitHeaders,
      status: 429,
    });
  }

  const projectDocumentAnalysis = await analyzeProjectDocument(
    parsedParams.data.projectId,
    parsedParams.data.documentId,
    auth.user.id,
    resolveProjectDocumentAnalysisLocale(request),
  ).catch((error: unknown) => {
    console.error("Project document analysis route failed", error);

    return {
      ok: false as const,
      reason: "server_error" as const,
    };
  });
  const response = createAnalyzeProjectDocumentResponse(projectDocumentAnalysis);

  if (!projectDocumentAnalysis.ok) {
    return NextResponse.json(response, {
      headers: rateLimitHeaders,
      status: getProjectDocumentAnalysisErrorStatus(
        projectDocumentAnalysis.reason,
      ),
    });
  }

  return NextResponse.json(response, {
    headers: rateLimitHeaders,
  });
}

function resolveProjectDocumentAnalysisLocale(request: Request): Locale {
  const requestUrl = new URL(request.url);
  const queryLocale = requestUrl.searchParams.get("locale") ?? undefined;

  if (queryLocale) {
    return resolveLocale(queryLocale);
  }

  const referer = request.headers.get("referer");

  if (!referer) {
    return resolveLocale(undefined);
  }

  try {
    return resolveLocale(new URL(referer).pathname.split("/")[1]);
  } catch {
    return resolveLocale(undefined);
  }
}
