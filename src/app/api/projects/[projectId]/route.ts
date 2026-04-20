import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getProjectById } from "@/server/services/project-service";

type ProjectRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: ProjectRouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const params = projectIdSchema.parse(await context.params);
  const project = await getProjectById(params.projectId, auth.user.id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
