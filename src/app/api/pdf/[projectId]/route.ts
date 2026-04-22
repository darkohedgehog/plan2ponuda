import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { generateQuotePdf } from "@/lib/pdf/generate-quote";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getQuoteExportData } from "@/server/services/quote-service";

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

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }

  const quoteData = await getQuoteExportData(
    parsedParams.data.projectId,
    auth.user.id,
  );

  if (!quoteData) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const pdf = await generateQuotePdf(quoteData);
  const body = new ArrayBuffer(pdf.byteLength);

  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${getQuoteFileName(
        quoteData.project.name,
      )}"`,
      "Content-Length": pdf.byteLength.toString(),
      "Content-Type": "application/pdf",
    },
  });
}

function getQuoteFileName(projectName: string): string {
  const slug = projectName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `quote-${slug || "project"}.pdf`;
}
