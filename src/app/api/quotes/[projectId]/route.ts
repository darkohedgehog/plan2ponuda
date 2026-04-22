import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { updateProjectMaterialsSchema } from "@/lib/validations/quote.schema";
import {
  getQuoteForProject,
  updateProjectMaterials,
} from "@/server/services/quote-service";

type QuoteRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: QuoteRouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const params = projectIdSchema.parse(await context.params);
  const quote = await getQuoteForProject(params.projectId, auth.user.id);

  if (!quote) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ quote });
}

export async function PUT(request: Request, context: QuoteRouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = updateProjectMaterialsSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Enter valid material names, quantities, and unit prices." },
      { status: 400 },
    );
  }

  const result = await updateProjectMaterials(
    parsedParams.data.projectId,
    auth.user.id,
    parsedInput.data,
  ).catch((error: unknown) => {
    console.error("Material save failed", error);

    return {
      ok: false as const,
      reason: "server_error" as const,
    };
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === "not_found"
            ? "Project not found."
            : result.reason === "invalid_material_reference"
              ? "One or more materials do not belong to this project."
              : "Unable to save materials.",
      },
      {
        status:
          result.reason === "not_found"
            ? 404
            : result.reason === "server_error"
              ? 500
              : 400,
      },
    );
  }

  return NextResponse.json({
    materials: result.materials,
    quote: result.quote,
  });
}
