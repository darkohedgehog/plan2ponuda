import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import {
  AI_RATE_LIMIT,
  checkRateLimit,
  createAiRateLimitKey,
  getRateLimitHeaders,
} from "@/lib/ai/rate-limit";
import { projectIdSchema } from "@/lib/validations/project.schema";
import {
  analyzeProject,
  getAnalyzeProjectPreflight,
  type AnalyzeProjectResult,
} from "@/server/services/analysis-service";
import type {
  AnalysisError,
  AnalysisErrorCode,
  AnalyzeProjectResponse,
} from "@/types/analysis";

type AnalyzeProjectFailureReason = Extract<
  AnalyzeProjectResult,
  { ok: false }
>["reason"];

type AnalysisRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(_request: Request, context: AnalysisRouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json(createErrorResponse("invalid_input"), {
      status: 400,
    });
  }

  const params = parsedParams.data;
  const preflight = await getAnalyzeProjectPreflight(
    params.projectId,
    auth.user.id,
  );

  if (!preflight.ok) {
    return NextResponse.json(createErrorResponse(preflight.reason), {
      status: getErrorStatus(preflight.reason),
    });
  }

  const rateLimit = checkRateLimit({
    key: createAiRateLimitKey({
      endpoint: "analysis",
      userId: auth.user.id,
    }),
    ...AI_RATE_LIMIT,
  });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.ok) {
    return NextResponse.json(
      createErrorResponse("rate_limited"),
      {
        headers: rateLimitHeaders,
        status: 429,
      },
    );
  }

  const analysis: AnalyzeProjectResult = await analyzeProject(
    params.projectId,
    auth.user.id,
  ).catch((error: unknown) => {
    console.error("Floor plan analysis route failed", error);

    return {
      ok: false,
      reason: "server_error",
    };
  });

  if (!analysis.ok) {
    const errorCode = getPublicErrorCode(analysis.reason);

    return NextResponse.json(createErrorResponse(errorCode), {
      headers: rateLimitHeaders,
      status: getErrorStatus(errorCode),
    });
  }

  const response: AnalyzeProjectResponse = {
    analysis: {
      id: analysis.analysisId,
      roomCount: analysis.roomCount,
      status: "success",
    },
    ok: true,
  };

  return NextResponse.json(response, {
    headers: rateLimitHeaders,
  });
}

function createErrorResponse(code: AnalysisErrorCode): AnalyzeProjectResponse {
  return {
    error: {
      code,
      message: getSafeErrorMessage(code),
    },
    ok: false,
  };
}

function getPublicErrorCode(
  reason: AnalyzeProjectFailureReason,
): AnalysisErrorCode {
  switch (reason) {
    case "missing_floor_plan":
    case "not_found":
    case "rooms_already_exist":
    case "unsupported_file_type":
      return reason;
    case "malformed_ai_response":
    case "missing_api_key":
    case "provider_error":
    case "storage_download_failed":
      return "ai_failed";
    case "server_error":
      return "server_error";
  }
}

function getErrorStatus(code: AnalysisErrorCode): number {
  switch (code) {
    case "invalid_input":
      return 400;
    case "not_found":
      return 404;
    case "missing_floor_plan":
    case "rooms_already_exist":
    case "unsupported_file_type":
      return 409;
    case "rate_limited":
      return 429;
    case "ai_failed":
    case "server_error":
      return 500;
  }
}

function getSafeErrorMessage(code: AnalysisErrorCode): AnalysisError["message"] {
  switch (code) {
    case "invalid_input":
      return "Invalid project.";
    case "missing_floor_plan":
      return "Upload a floor plan before running analysis.";
    case "not_found":
      return "Project not found.";
    case "rate_limited":
      return "Too many AI requests. Please try again shortly.";
    case "rooms_already_exist":
      return "This project already has rooms. Save or remove existing rooms before running analysis again.";
    case "unsupported_file_type":
      return "The uploaded floor plan type is not supported for analysis.";
    case "ai_failed":
    case "server_error":
      return "Unable to analyze this floor plan.";
  }
}
