import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project.schema";
import { createProject, listProjects } from "@/server/services/project-service";

export async function GET() {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const projects = await listProjects(auth.user.id);

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as unknown;
  const input: CreateProjectInput = createProjectSchema.parse(body);
  const project = await createProject(input, auth.user.id);

  return NextResponse.json({ project }, { status: 201 });
}
