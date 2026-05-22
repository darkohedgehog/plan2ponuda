import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getProjectDocuments } from "@/server/services/project-document-service";
import type { ProjectDocumentsResponse } from "@/types/project-document";

type ProjectDocumentsRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: ProjectDocumentsRouteContext,
) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    const response: ProjectDocumentsResponse = {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Invalid project id.",
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  const documents = await getProjectDocuments(
    parsedParams.data.projectId,
    auth.user.id,
  );
  const response: ProjectDocumentsResponse = {
    ok: true,
    documents,
  };

  return NextResponse.json(response);
}
