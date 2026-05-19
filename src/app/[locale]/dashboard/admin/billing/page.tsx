import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ReceiptText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";

import { InvoiceTaskQueue } from "@/components/admin/invoice-task-queue";
import { requireAdmin } from "@/lib/auth/admin";
import {
  customerTypeValues,
  invoiceTaskFiltersSchema,
  invoiceTaskStatusValues,
} from "@/lib/validations/billing.schema";
import { getAdminInvoiceTaskQueue } from "@/server/services/invoice-task-service";
import { resolveLocale, type Locale } from "@/i18n/routing";
import type {
  AdminInvoiceTaskFilters,
  AdminInvoiceTaskSummary,
  AdminInvoiceTaskSummaryStatus,
} from "@/types/billing";

type AdminBillingPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    customerType?: string;
    status?: string;
  }>;
};

type SummaryCard = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  key: AdminInvoiceTaskSummaryStatus;
};

const summaryCards: SummaryCard[] = [
  {
    icon: Clock3,
    key: "pending",
  },
  {
    icon: AlertTriangle,
    key: "needs_review",
  },
  {
    icon: CheckCircle2,
    key: "issued",
  },
  {
    icon: XCircle,
    key: "failed",
  },
];

function getFilterValue(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function getInvoiceTaskFilters(searchParams: {
  customerType?: string;
  status?: string;
}): AdminInvoiceTaskFilters {
  const parsedFilters = invoiceTaskFiltersSchema.safeParse({
    customerType: getFilterValue(searchParams.customerType),
    status: getFilterValue(searchParams.status),
  });

  return parsedFilters.success ? parsedFilters.data : {};
}

export default async function AdminBillingPage({
  params,
  searchParams,
}: AdminBillingPageProps) {
  await requireAdmin();

  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const filters = getInvoiceTaskFilters(await searchParams);
  const invoiceTaskQueue = await getAdminInvoiceTaskQueue(filters);
  const tAdmin = await getTranslations("Admin");
  const tCustomerTypes = await getTranslations("CustomerTypes");

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-deep-twilight-950 text-turquoise-surf-300">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-bright-teal-blue-700">
              {tAdmin("billing.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-deep-twilight-950">
              {tAdmin("billing.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-deep-twilight-700">
              {tAdmin("billing.description")}
            </p>
          </div>
        </div>
      </section>

      <SummaryCards
        labels={{
          failed: tAdmin("billing.summary.failed"),
          issued: tAdmin("billing.summary.issued"),
          needs_review: tAdmin("billing.summary.needsReview"),
          pending: tAdmin("billing.summary.pending"),
        }}
        locale={locale}
        summary={invoiceTaskQueue.summary}
      />

      <section className="rounded-lg border border-frosted-blue-200 bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-deep-twilight-800">
            {tAdmin("billing.filters.status")}
            <select
              className="h-10 rounded-md border border-frosted-blue-200 bg-white px-3 text-sm text-deep-twilight-950 shadow-sm outline-none transition-colors focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
              defaultValue={filters.status ?? ""}
              name="status"
            >
              <option value="">{tAdmin("billing.filters.allStatuses")}</option>
              {invoiceTaskStatusValues.map((status) => (
                <option key={status} value={status}>
                  {tAdmin(`billing.statuses.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-deep-twilight-800">
            {tAdmin("billing.filters.customerType")}
            <select
              className="h-10 rounded-md border border-frosted-blue-200 bg-white px-3 text-sm text-deep-twilight-950 shadow-sm outline-none transition-colors focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
              defaultValue={filters.customerType ?? ""}
              name="customerType"
            >
              <option value="">
                {tAdmin("billing.filters.allCustomerTypes")}
              </option>
              {customerTypeValues.map((customerType) => (
                <option key={customerType} value={customerType}>
                  {tCustomerTypes(customerType)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
            type="submit"
          >
            <ReceiptText aria-hidden="true" className="h-4 w-4" />
            {tAdmin("billing.filters.apply")}
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 shadow-sm outline-none transition-colors hover:border-bright-teal-blue-200 hover:bg-frosted-blue-50 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
            href={`/${locale}/dashboard/admin/billing`}
          >
            {tAdmin("billing.filters.clear")}
          </Link>
        </form>
      </section>

      <InvoiceTaskQueue locale={locale} tasks={invoiceTaskQueue.tasks} />
    </main>
  );
}

type SummaryCardsProps = {
  labels: Record<AdminInvoiceTaskSummaryStatus, string>;
  locale: Locale;
  summary: AdminInvoiceTaskSummary;
};

function SummaryCards({ labels, locale, summary }: SummaryCardsProps) {
  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            className="rounded-lg border border-frosted-blue-200 bg-white p-4 shadow-sm"
            key={card.key}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55">
                  {labels[card.key]}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-deep-twilight-950">
                  {numberFormatter.format(summary[card.key])}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
