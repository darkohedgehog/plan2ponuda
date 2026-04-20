import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getQuoteForProject } from "@/server/services/quote-service";

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
