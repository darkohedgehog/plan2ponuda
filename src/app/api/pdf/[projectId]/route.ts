import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { generateQuotePdf } from "@/lib/pdf/generate-quote";
import { getQuoteForProject } from "@/server/services/quote-service";

type PdfRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: PdfRouteContext) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const params = projectIdSchema.parse(await context.params);
  const quote = await getQuoteForProject(params.projectId, auth.user.id);

  if (!quote) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const pdf = await generateQuotePdf(quote);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quote-${params.projectId}.pdf"`,
    },
  });
}
