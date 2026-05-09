import { getTranslations } from "next-intl/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  defaultLocale,
  locales,
  type Locale,
} from "@/i18n/routing";
import { requireApiUser } from "@/lib/auth/guards";
import {
  generateQuotePdf,
  type QuotePdfLabels,
} from "@/lib/pdf/generate-quote";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getQuoteExportData } from "@/server/services/quote-service";

type PdfRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(request: NextRequest, context: PdfRouteContext) {
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

  const locale = resolvePdfLocale(request);
  const labels = await getQuotePdfLabels(locale);
  const pdf = await generateQuotePdf(quoteData, {
    labels,
    locale,
  });
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

async function getQuotePdfLabels(locale: Locale): Promise<QuotePdfLabels> {
  const tCategories = await getTranslations({
    locale,
    namespace: "MaterialCategories",
  });
  const tMaterialCatalogItems = await getTranslations({
    locale,
    namespace: "Materials.catalogItems",
  });
  const tObjectTypes = await getTranslations({
    locale,
    namespace: "Projects.objectTypes",
  });
  const tPdf = await getTranslations({
    locale,
    namespace: "QuotePdf",
  });
  const tRoomTypes = await getTranslations({
    locale,
    namespace: "RoomTypes",
  });
  const tUnits = await getTranslations({
    locale,
    namespace: "MaterialUnits",
  });

  return {
    fallbacks: {
      material: tPdf("fallbacks.material"),
      notSpecified: tPdf("fallbacks.notSpecified"),
    },
    fields: {
      area: tPdf("fields.area"),
      client: tPdf("fields.client"),
      generatedDate: tPdf("fields.generatedDate"),
      objectType: tPdf("fields.objectType"),
      project: tPdf("fields.project"),
    },
    companyFields: {
      address: tPdf("companyFields.address"),
      city: tPdf("companyFields.city"),
      country: tPdf("companyFields.country"),
      email: tPdf("companyFields.email"),
      fullName: tPdf("companyFields.fullName"),
      name: tPdf("companyFields.name"),
      phone: tPdf("companyFields.phone"),
      taxId: tPdf("companyFields.taxId"),
    },
    intro: tPdf("intro"),
    materialCatalogItems: {
      breaker: tMaterialCatalogItems("breaker"),
      cable3x15: tMaterialCatalogItems("cable3x15"),
      cable3x25: tMaterialCatalogItems("cable3x25"),
      installationMisc: tMaterialCatalogItems("installationMisc"),
      junctionBox: tMaterialCatalogItems("junctionBox"),
      lightPoint: tMaterialCatalogItems("lightPoint"),
      panel: tMaterialCatalogItems("panel"),
      socketModule: tMaterialCatalogItems("socketModule"),
      switchModule: tMaterialCatalogItems("switchModule"),
    },
    materialCategories: {
      box: tCategories("box"),
      breaker: tCategories("breaker"),
      cable: tCategories("cable"),
      other: tCategories("other"),
      panel: tCategories("panel"),
      socket: tCategories("socket"),
      switch: tCategories("switch"),
    },
    materialUnits: {
      m: tUnits("m"),
      pcs: tUnits("pcs"),
      set: tUnits("set"),
    },
    objectTypes: {
      apartment: tObjectTypes("apartment"),
      house: tObjectTypes("house"),
      office: tObjectTypes("office"),
    },
    roomTypes: {
      bathroom: tRoomTypes("bathroom"),
      bedroom: tRoomTypes("bedroom"),
      hallway: tRoomTypes("hallway"),
      kitchen: tRoomTypes("kitchen"),
      living_room: tRoomTypes("living_room"),
      office: tRoomTypes("office"),
      unknown: tRoomTypes("unknown"),
    },
    sections: {
      materialList: tPdf("sections.materialList"),
      project: tPdf("sections.project"),
      provider: tPdf("sections.provider"),
      roomSummary: tPdf("sections.roomSummary"),
      totals: tPdf("sections.totals"),
    },
    tables: {
      category: tPdf("tables.category"),
      lights: tPdf("tables.lights"),
      material: tPdf("tables.material"),
      quantity: tPdf("tables.quantity"),
      room: tPdf("tables.room"),
      sockets: tPdf("tables.sockets"),
      switches: tPdf("tables.switches"),
      totalPrice: tPdf("tables.totalPrice"),
      type: tPdf("tables.type"),
      unit: tPdf("tables.unit"),
      unitPrice: tPdf("tables.unitPrice"),
    },
    title: tPdf("title"),
    totals: {
      laborCost: tPdf("totals.laborCost"),
      materialCost: tPdf("totals.materialCost"),
      subtotal: tPdf("totals.subtotal"),
      total: tPdf("totals.total"),
    },
  };
}

function resolvePdfLocale(request: NextRequest): Locale {
  const candidates = [
    request.nextUrl.searchParams.get("locale") ?? undefined,
    getLocaleFromReferer(request.headers.get("referer")),
    request.cookies.get("NEXT_LOCALE")?.value,
  ];

  return (
    candidates.find((candidate): candidate is Locale =>
      locales.some((locale) => locale === candidate),
    ) ?? defaultLocale
  );
}

function getLocaleFromReferer(referer: string | null): string | undefined {
  if (!referer) {
    return undefined;
  }

  try {
    const pathname = new URL(referer).pathname;

    return pathname.split("/").filter(Boolean)[0];
  } catch {
    return undefined;
  }
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
