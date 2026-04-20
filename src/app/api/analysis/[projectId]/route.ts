import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
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

  const params = projectIdSchema.parse(await context.params);
  const analysis = await analyzeProject(params.projectId, auth.user.id);

  if (!analysis) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}
