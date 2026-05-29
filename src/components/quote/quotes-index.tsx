import { useLocale, useTranslations } from "next-intl";
import { Download, FileText } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { QuoteIndexItem } from "@/types/quote";

type QuotesIndexProps = {
  quotes: QuoteIndexItem[];
};

export function QuotesIndex({ quotes }: QuotesIndexProps) {
  const tCommon = useTranslations("Common");
  const tQuotes = useTranslations("Quotes.index");

  if (quotes.length === 0) {
    return <EmptyQuotesState />;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-frosted-blue-200 bg-white shadow-sm">
      <div className="border-b border-frosted-blue-200 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-deep-twilight-950">
          {tQuotes("title")}
        </h2>
        <p className="mt-1 text-sm text-deep-twilight-700/70">
          {tQuotes("subtitle")}
        </p>
      </div>

      <div className="hidden border-b border-frosted-blue-200 bg-frosted-blue-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55 xl:grid xl:grid-cols-[minmax(0,1.2fr)_minmax(9rem,0.8fr)_8rem_8rem_8rem_9rem_12rem] xl:gap-5">
        <span>{tCommon("project")}</span>
        <span>{tCommon("client")}</span>
        <span>{tCommon("object")}</span>
        <span className="text-right">{tCommon("materials")}</span>
        <span className="text-right">{tCommon("labor")}</span>
        <span className="text-right">{tCommon("total")}</span>
        <span className="text-right">{tCommon("actions")}</span>
      </div>

      <div className="divide-y divide-frosted-blue-200">
        {quotes.map((quote) => (
          <QuoteIndexRow key={quote.id} quote={quote} />
        ))}
      </div>
    </section>
  );
}

type QuoteIndexRowProps = {
  quote: QuoteIndexItem;
};

function QuoteIndexRow({ quote }: QuoteIndexRowProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tCommon = useTranslations("Common");
  const tProjects = useTranslations("Projects");
  const tQuotes = useTranslations("Quotes.index");
  const objectTypeLabel =
    quote.project.objectType === "apartment"
      ? tProjects("objectTypes.apartment")
      : quote.project.objectType === "house"
        ? tProjects("objectTypes.house")
        : quote.project.objectType === "office"
          ? tProjects("objectTypes.office")
          : quote.project.objectType;

  return (
    <article className="grid min-w-0 gap-4 bg-white p-4 transition-colors hover:bg-frosted-blue-50/70 sm:p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(9rem,0.8fr)_8rem_8rem_8rem_9rem_12rem] xl:items-center xl:gap-5">
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-deep-twilight-950">
          {quote.project.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-deep-twilight-700/70">
          {tQuotes("updatedAt", { date: formatDate(quote.updatedAt, locale) })}
        </p>
      </div>

      <QuoteMobileField label={tCommon("client")}>
        <span className="block truncate text-sm font-medium text-deep-twilight-800">
          {quote.project.clientName ?? tProjects("card.noClientAssigned")}
        </span>
      </QuoteMobileField>
      <QuoteMobileField label={tCommon("object")}>
        <span className="text-sm font-medium text-deep-twilight-800">
          {objectTypeLabel}
        </span>
      </QuoteMobileField>
      <QuoteMobileField align="right" label={tCommon("materials")}>
        <span className="text-sm font-medium text-deep-twilight-800">
          {formatMoney(Number(quote.materialCost), locale)}
        </span>
      </QuoteMobileField>
      <QuoteMobileField align="right" label={tCommon("labor")}>
        <span className="text-sm font-medium text-deep-twilight-800">
          {formatMoney(Number(quote.laborCost), locale)}
        </span>
      </QuoteMobileField>
      <QuoteMobileField align="right" label={tCommon("total")}>
        <span className="text-base font-semibold text-deep-twilight-950">
          {formatMoney(Number(quote.total), locale)}
        </span>
      </QuoteMobileField>

      <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 shadow-sm outline-none transition-colors hover:bg-frosted-blue-100 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
          href={`/dashboard/projects/${quote.project.id}/quote`}
        >
          <FileText aria-hidden="true" className="h-4 w-4 shrink-0" />
          {tActions("openQuote")}
        </Link>
        <a
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
          href={`/api/pdf/${quote.project.id}?locale=${locale}`}
        >
          <Download aria-hidden="true" className="h-4 w-4 shrink-0" />
          {tActions("exportPdf")}
        </a>
      </div>
    </article>
  );
}

type QuoteMobileFieldProps = {
  align?: "left" | "right";
  children: ReactNode;
  label: string;
};

function QuoteMobileField({
  align = "left",
  children,
  label,
}: QuoteMobileFieldProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 xl:block ${
        align === "right" ? "xl:text-right" : ""
      }`}
    >
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55 xl:hidden">
        {label}
      </span>
      <div className="min-w-0 text-right xl:text-inherit">{children}</div>
    </div>
  );
}

function EmptyQuotesState() {
  const tActions = useTranslations("Actions");
  const tEmptyState = useTranslations("EmptyStates.quotes.noQuotes");

  return (
    <section className="rounded-lg border border-dashed border-frosted-blue-300 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
        <FileText aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-deep-twilight-950">
        {tEmptyState("title")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-deep-twilight-700">
        {tEmptyState("description")}
      </p>
      <div className="mt-6">
        <Link
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-deep-twilight-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-fit"
          href="/dashboard/projects"
        >
          {tActions("viewProjects")}
        </Link>
      </div>
    </section>
  );
}

function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
