import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/guards";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project.schema";
import {
  createProject,
  getUserProjects,
} from "@/server/services/project-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type { CreateProjectResponse } from "@/types/project";

const invalidProjectInputResponse: CreateProjectResponse = {
  ok: false,
  error: {
    code: "invalid_input",
    message: "Enter a project name, object type, and area greater than 0.",
  },
};

export async function GET() {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const projects = await getUserProjects(auth.user.id);

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    await checkRateLimitOrThrow({
      key: createUserRateLimitKey({
        userId: auth.user.id,
      }),
      scope: RATE_LIMIT_SCOPES.projectCreate,
      ...RATE_LIMIT_POLICIES.projectCreate,
    });

    const body = await request.json().catch((): unknown => null);
    const input: CreateProjectInput = createProjectSchema.parse(body);
    const project = await createProject(input, auth.user.id);

    const response: CreateProjectResponse = {
      ok: true,
      projectId: project.id,
      project,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: CreateProjectResponse = {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many requests. Please try again later.",
        },
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(invalidProjectInputResponse, { status: 400 });
    }

    console.error("Project creation failed", error);

    const response: CreateProjectResponse = {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to create project.",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
