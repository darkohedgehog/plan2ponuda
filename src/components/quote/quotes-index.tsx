import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { QuoteIndexItem } from "@/types/quote";

type QuotesIndexProps = {
  quotes: QuoteIndexItem[];
};

export function QuotesIndex({ quotes }: QuotesIndexProps) {
  if (quotes.length === 0) {
    return <EmptyQuotesState />;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Generated quotes
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Newest quote updates are shown first.
        </p>
      </div>

      <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 xl:grid xl:grid-cols-[minmax(0,1.2fr)_minmax(9rem,0.8fr)_8rem_8rem_8rem_9rem_12rem] xl:gap-5">
        <span>Project</span>
        <span>Client</span>
        <span>Object</span>
        <span className="text-right">Materials</span>
        <span className="text-right">Labor</span>
        <span className="text-right">Total</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-slate-200">
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
  return (
    <article className="grid min-w-0 gap-4 bg-white p-4 transition-colors hover:bg-slate-50/70 sm:p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(9rem,0.8fr)_8rem_8rem_8rem_9rem_12rem] xl:items-center xl:gap-5">
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-slate-950">
          {quote.project.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Updated {formatDate(quote.updatedAt)}
        </p>
      </div>

      <QuoteMobileField label="Client">
        <span className="block truncate text-sm font-medium text-slate-700">
          {quote.project.clientName ?? "No client assigned"}
        </span>
      </QuoteMobileField>
      <QuoteMobileField label="Object">
        <span className="text-sm font-medium text-slate-700">
          {formatObjectType(quote.project.objectType)}
        </span>
      </QuoteMobileField>
      <QuoteMobileField align="right" label="Materials">
        <span className="text-sm font-medium text-slate-700">
          {formatMoney(Number(quote.materialCost))}
        </span>
      </QuoteMobileField>
      <QuoteMobileField align="right" label="Labor">
        <span className="text-sm font-medium text-slate-700">
          {formatMoney(Number(quote.laborCost))}
        </span>
      </QuoteMobileField>
      <QuoteMobileField align="right" label="Total">
        <span className="text-base font-semibold text-slate-950">
          {formatMoney(Number(quote.total))}
        </span>
      </QuoteMobileField>

      <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
          href={`/dashboard/projects/${quote.project.id}/quote`}
        >
          Open Quote
        </Link>
        <a
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
          href={`/api/pdf/${quote.project.id}`}
        >
          Export PDF
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
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400 xl:hidden">
        {label}
      </span>
      <div className="min-w-0 text-right xl:text-inherit">{children}</div>
    </div>
  );
}

function EmptyQuotesState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M10 13h6" />
          <path d="M10 17h4" />
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-950">
        No quotes generated yet
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Generated project quotes will appear here after you complete review and
        open a project quote workspace.
      </p>
      <div className="mt-6">
        <Link
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-fit"
          href="/dashboard/projects"
        >
          View Projects
        </Link>
      </div>
    </section>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("hr-HR", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatObjectType(value: string): string {
  const labels: Record<string, string> = {
    apartment: "Apartment",
    house: "House",
    office: "Office",
  };

  return labels[value] ?? value;
}
