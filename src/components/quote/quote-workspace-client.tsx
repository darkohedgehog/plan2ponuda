"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  QuoteMaterialEditor,
  type QuoteMaterialEditorMaterial,
} from "@/components/quote/quote-material-editor";
import type { ProjectMaterial, Quote } from "@/types/quote";

type QuoteTotals = Pick<
  Quote,
  "laborCost" | "materialCost" | "projectId" | "subtotal" | "total"
>;

type QuoteWorkspaceClientProps = {
  areaM2: number;
  excelHref: string;
  exportHref: string;
  initialMaterials: QuoteMaterialEditorMaterial[];
  initialQuote: QuoteTotals;
  projectName: string;
};

export function QuoteWorkspaceClient({
  areaM2,
  excelHref,
  exportHref,
  initialMaterials,
  initialQuote,
  projectName,
}: QuoteWorkspaceClientProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tWorkspace = useTranslations("QuoteWorkspace");
  const [quote, setQuote] = useState<QuoteTotals>(initialQuote);

  function handleMaterialsSaved(result: {
    materials: ProjectMaterial[];
    quote: Quote;
  }) {
    setQuote({
      laborCost: result.quote.laborCost,
      materialCost: result.quote.materialCost,
      projectId: result.quote.projectId,
      subtotal: result.quote.subtotal,
      total: result.quote.total,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-bright-teal-blue-700">
          {tWorkspace("hero.eyebrow")}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-deep-twilight-950 sm:text-3xl">
              {projectName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
              {tWorkspace("hero.description")}
            </p>
            <p className="mt-2 text-sm font-medium text-deep-twilight-700/70">
              {tWorkspace("metrics.projectArea", {
                area: formatArea(areaM2, locale),
              })}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
            <div className="rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55">
                {tWorkspace("metrics.quoteTotal")}
              </p>
              <p className="mt-1 text-lg font-semibold text-deep-twilight-950">
                {formatMoney(Number(quote.total), locale)}
              </p>
            </div>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 shadow-sm outline-none transition-colors hover:border-bright-teal-blue-200 hover:bg-frosted-blue-50 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
              href={excelHref}
            >
              <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
              {tActions("exportExcel")}
            </a>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
              href={exportHref}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              {tActions("exportPdf")}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuoteMetricCard
          label={tWorkspace("metrics.materialCost")}
          value={formatMoney(Number(quote.materialCost), locale)}
        />
        <QuoteMetricCard
          label={tWorkspace("metrics.laborCost")}
          value={formatMoney(Number(quote.laborCost), locale)}
        />
        <QuoteMetricCard
          label={tWorkspace("metrics.subtotal")}
          value={formatMoney(Number(quote.subtotal), locale)}
        />
        <QuoteMetricCard
          emphasize
          label={tWorkspace("metrics.total")}
          value={formatMoney(Number(quote.total), locale)}
        />
      </section>

      <section className="rounded-lg border border-frosted-blue-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-lg font-semibold text-deep-twilight-950">
            {tWorkspace("materials.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-deep-twilight-700">
            {tWorkspace("materials.subtitle")}
          </p>
        </div>

        <QuoteMaterialEditor
          initialMaterials={initialMaterials}
          onSaved={handleMaterialsSaved}
          projectId={quote.projectId}
        />
      </section>
    </div>
  );
}

type QuoteMetricCardProps = {
  emphasize?: boolean;
  label: string;
  value: string;
};

function QuoteMetricCard({
  emphasize = false,
  label,
  value,
}: QuoteMetricCardProps) {
  return (
    <article
      className={`rounded-lg border p-4 shadow-sm ${
        emphasize
          ? "border-bright-teal-blue-200 bg-bright-teal-blue-50"
          : "border-frosted-blue-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          emphasize ? "text-bright-teal-blue-700" : "text-deep-twilight-700/55"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-deep-twilight-950">{value}</p>
    </article>
  );
}

function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function formatArea(value: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value)} m2`;
}
