import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import {
  AI_RATE_LIMIT,
  checkRateLimit,
  createAiRateLimitKey,
  getRateLimitHeaders,
} from "@/lib/ai/rate-limit";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { analyzeProject } from "@/server/services/analysis-service";

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
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
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
      { error: "Too many AI requests. Please try again shortly." },
      {
        headers: rateLimitHeaders,
        status: 429,
      },
    );
  }

  const params = parsedParams.data;
  const analysis = await analyzeProject(params.projectId, auth.user.id);

  if (!analysis) {
    return NextResponse.json(
      { error: "Project not found" },
      {
        headers: rateLimitHeaders,
        status: 404,
      },
    );
  }

  return NextResponse.json(
    { analysis },
    {
      headers: rateLimitHeaders,
    },
  );
}
