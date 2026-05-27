import { getTranslations } from "next-intl/server";
import { type NextRequest, NextResponse } from "next/server";

import {
  defaultLocale,
  locales,
  type Locale,
} from "@/i18n/routing";
import { requireApiVerifiedUser } from "@/lib/auth/guards";
import {
  generateQuoteExcelBuffer,
  getQuoteExcelFileName,
  type QuoteExcelLabels,
} from "@/lib/excel/generate-quote";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getQuoteExportData } from "@/server/services/quote-service";

type ExcelRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(request: NextRequest, context: ExcelRouteContext) {
  const auth = await requireApiVerifiedUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }

  // TODO: Decide whether Excel export should become a paid-plan feature.
  const quoteData = await getQuoteExportData(
    parsedParams.data.projectId,
    auth.user.id,
  );

  if (!quoteData) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const locale = resolveExcelLocale(request);
  const labels = await getQuoteExcelLabels(locale);
  const workbook = await generateQuoteExcelBuffer(quoteData, {
    labels,
    locale,
  });

  return new Response(workbook, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${getQuoteExcelFileName(
        quoteData.project.name,
      )}"`,
      "Content-Length": workbook.byteLength.toString(),
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

async function getQuoteExcelLabels(locale: Locale): Promise<QuoteExcelLabels> {
  const tCategories = await getTranslations({
    locale,
    namespace: "MaterialCategories",
  });
  const tExcel = await getTranslations({
    locale,
    namespace: "QuoteExcel",
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
    fallbacks: {
      material: tPdf("fallbacks.material"),
      notSpecified: tPdf("fallbacks.notSpecified"),
    },
    fields: {
      area: tExcel("fields.area"),
      category: tExcel("fields.category"),
      client: tExcel("fields.client"),
      code: tExcel("fields.code"),
      confidence: tExcel("fields.confidence"),
      generatedDate: tExcel("fields.generatedDate"),
      laborCost: tExcel("fields.laborCost"),
      material: tExcel("fields.material"),
      materialCost: tExcel("fields.materialCost"),
      objectType: tExcel("fields.objectType"),
      project: tExcel("fields.project"),
      provider: tExcel("fields.provider"),
      quantity: tExcel("fields.quantity"),
      resolvedLights: tExcel("fields.resolvedLights"),
      resolvedSockets: tExcel("fields.resolvedSockets"),
      resolvedSwitches: tExcel("fields.resolvedSwitches"),
      room: tExcel("fields.room"),
      roomType: tExcel("fields.roomType"),
      source: tExcel("fields.source"),
      subtotal: tExcel("fields.subtotal"),
      suggestedLights: tExcel("fields.suggestedLights"),
      suggestedSockets: tExcel("fields.suggestedSockets"),
      suggestedSwitches: tExcel("fields.suggestedSwitches"),
      total: tExcel("fields.total"),
      totalPrice: tExcel("fields.totalPrice"),
      unit: tExcel("fields.unit"),
      unitPrice: tExcel("fields.unitPrice"),
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
    materialSources: {
      ai: tExcel("materialSources.ai"),
      manual: tExcel("materialSources.manual"),
      rule: tExcel("materialSources.rule"),
    },
    materialUnits: {
      m: tUnits("m"),
      pcs: tUnits("pcs"),
      set: tUnits("set"),
    },
    notes: {
      empty: tExcel("notes.empty"),
      reviewStatement: tExcel("notes.reviewStatement"),
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
    sheets: {
      materials: tExcel("sheets.materials"),
      notes: tExcel("sheets.notes"),
      rooms: tExcel("sheets.rooms"),
      summary: tExcel("sheets.summary"),
    },
    title: tExcel("title"),
  };
}

function resolveExcelLocale(request: NextRequest): Locale {
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
