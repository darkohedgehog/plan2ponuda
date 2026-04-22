import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import {
  materialIdSchema,
  updateMaterialSchema,
} from "@/lib/validations/material.schema";
import { updateMaterialDefaultPrice } from "@/server/services/material-service";

type MaterialRouteContext = {
  params: Promise<{
    materialId: string;
  }>;
};

export async function PUT(request: Request, context: MaterialRouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = materialIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid material." }, { status: 400 });
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = updateMaterialSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Enter a valid default price." },
      { status: 400 },
    );
  }

  const material = await updateMaterialDefaultPrice(
    parsedParams.data.materialId,
    parsedInput.data,
  ).catch((error: unknown) => {
    console.error("Material price save failed", error);

    return "server_error" as const;
  });

  if (material === "server_error") {
    return NextResponse.json(
      { error: "Unable to save material price." },
      { status: 500 },
    );
  }

  if (!material) {
    return NextResponse.json(
      { error: "Material not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ material });
}
