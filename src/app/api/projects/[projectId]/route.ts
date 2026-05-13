import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import {
  deleteProject,
  getProjectById,
} from "@/server/services/project-service";
import type { DeleteProjectResponse } from "@/types/project";

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

export async function DELETE(
  _request: Request,
  context: ProjectRouteContext,
) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    const response: DeleteProjectResponse = {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Invalid project id.",
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    const result = await deleteProject(
      parsedParams.data.projectId,
      auth.user.id,
    );

    if (!result.ok) {
      const response: DeleteProjectResponse = {
        ok: false,
        error: {
          code: "not_found",
          message: "Project not found.",
        },
      };

      return NextResponse.json(response, { status: 404 });
    }

    const response: DeleteProjectResponse = {
      ok: true,
      projectId: result.projectId,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Project deletion failed", error);

    const response: DeleteProjectResponse = {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to delete project.",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
