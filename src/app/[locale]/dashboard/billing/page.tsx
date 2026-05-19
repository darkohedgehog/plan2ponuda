import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Gauge,
  LockKeyhole,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BillingActions } from "@/components/billing/billing-actions";
import { BillingProfileForm } from "@/components/billing/billing-profile-form";
import { redirect } from "@/i18n/navigation";
import { resolveLocale, type Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/helpers";
import {
  getBillingProfile,
  getSubscription,
  getUsageForCurrentPeriod,
} from "@/server/services/billing-service";
import type {
  BillingFeature,
  BillingPlan,
  SubscriptionStatus,
  UsageItem,
} from "@/types/billing";

type BillingPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    checkout?: string;
  }>;
};

function formatDate(value: string | null, locale: Locale): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type BillingDisplayStatus = SubscriptionStatus | "free";

function getStatusBadgeClassName(status: BillingDisplayStatus): string {
  switch (status) {
    case "active":
    case "trialing":
      return "border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-800";
    case "past_due":
    case "incomplete":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "canceled":
    case "unpaid":
      return "border-red-200 bg-red-50 text-red-700";
    case "paused":
    case "free":
      return "border-frosted-blue-200 bg-frosted-blue-50 text-deep-twilight-700";
  }
}

function getPlanBadgeClassName(plan: BillingPlan): string {
  switch (plan) {
    case "free":
      return "border-frosted-blue-200 bg-frosted-blue-50 text-deep-twilight-700";
    case "basic":
      return "border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-800";
    case "pro":
      return "border-deep-twilight-200 bg-deep-twilight-950 text-white";
  }
}

export default async function BillingPage({
  params,
  searchParams,
}: BillingPageProps) {
  const { locale: rawLocale } = await params;
  const { checkout } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const [profile, subscription, usage] = await Promise.all([
    getBillingProfile(user.id),
    getSubscription(user.id),
    getUsageForCurrentPeriod(user.id),
  ]);
  const tBilling = await getTranslations("Billing");
  const tPlans = await getTranslations("Plans");
  const tUsage = await getTranslations("Usage");
  const currentStatus: BillingDisplayStatus = subscription?.status ?? "free";
  const checkoutStatus =
    checkout === "success" || checkout === "cancelled" ? checkout : null;
  const currentPeriodEnd = subscription?.currentPeriodEnd ?? null;
  const currentPeriodEndLabel = formatDate(currentPeriodEnd, locale);
  const hasStripeCustomer = Boolean(subscription?.stripeCustomerId);
  const cancellationNotice =
    subscription?.cancelAtPeriodEnd && currentPeriodEnd
      ? tBilling("summary.canceledUntil", {
          date: currentPeriodEndLabel,
        })
      : null;

  return (
    <main className="flex min-w-0 flex-col gap-6">
      <section className="overflow-hidden rounded-lg border border-frosted-blue-200 bg-white shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:p-7">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-bright-teal-blue-700">
              {tBilling("page.eyebrow")}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="wrap-break-word text-3xl font-semibold tracking-tight text-deep-twilight-950">
                  {tBilling("page.title")}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-deep-twilight-700">
                  {tBilling("page.description")}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  getStatusBadgeClassName(currentStatus),
                )}
              >
                {tBilling(`statuses.${currentStatus}`)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-frosted-blue-200 bg-frosted-blue-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-deep-twilight-500">
              {tBilling("summary.currentPlan")}
            </p>
            <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-3">
              <p className="truncate text-2xl font-semibold text-deep-twilight-950">
                {tPlans(`${usage.plan}.name`)}
              </p>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  getPlanBadgeClassName(usage.plan),
                )}
              >
                {tPlans(`${usage.plan}.price`)}
              </span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-deep-twilight-600">
                  {tBilling("summary.status")}
                </dt>
                <dd className="font-semibold text-deep-twilight-950">
                  {tBilling(`statuses.${currentStatus}`)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-deep-twilight-600">
                  {tBilling("summary.currentPeriodEnd")}
                </dt>
                <dd className="text-right font-semibold text-deep-twilight-950">
                  {currentPeriodEnd
                    ? currentPeriodEndLabel
                    : tBilling("summary.noPeriod")}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {cancellationNotice ? (
          <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 sm:px-6 lg:px-7">
            <div className="flex gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <p>{cancellationNotice}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-deep-twilight-950">
              {tBilling("summary.usageTitle")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-deep-twilight-700">
              {tBilling("summary.usageDescription")}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-frosted-blue-200 bg-frosted-blue-50 px-3 py-1 text-xs font-semibold text-deep-twilight-700">
            <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
            {currentPeriodEnd
              ? tBilling("summary.periodEndsOn", {
                  date: currentPeriodEndLabel,
                })
              : tBilling("summary.noPeriod")}
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <UsageCard
            feature="floorPlans"
            item={usage.items.floorPlans}
            label={tUsage("floorPlans")}
            limitReachedLabel={tUsage("limitReached")}
            progressLabel={tUsage("progressLabel", {
              feature: tUsage("floorPlans"),
            })}
            remainingLabel={tUsage("remaining", {
              count: Math.max(
                0,
                usage.items.floorPlans.limit - usage.items.floorPlans.current,
              ),
            })}
            usedLabel={tUsage("usedOfLimit", {
              limit: usage.items.floorPlans.limit,
              used: usage.items.floorPlans.current,
            })}
          />
          <UsageCard
            feature="quotes"
            item={usage.items.quotes}
            label={tUsage("quotes")}
            limitReachedLabel={tUsage("limitReached")}
            progressLabel={tUsage("progressLabel", {
              feature: tUsage("quotes"),
            })}
            remainingLabel={tUsage("remaining", {
              count: Math.max(
                0,
                usage.items.quotes.limit - usage.items.quotes.current,
              ),
            })}
            usedLabel={tUsage("usedOfLimit", {
              limit: usage.items.quotes.limit,
              used: usage.items.quotes.current,
            })}
          />
          <UsageCard
            feature="largePdfAnalyses"
            item={usage.items.largePdfAnalyses}
            label={tUsage("largePdfAnalyses")}
            limitReachedLabel={tUsage("limitReached")}
            progressLabel={tUsage("progressLabel", {
              feature: tUsage("largePdfAnalyses"),
            })}
            remainingLabel={tUsage("remaining", {
              count: Math.max(
                0,
                usage.items.largePdfAnalyses.limit -
                  usage.items.largePdfAnalyses.current,
              ),
            })}
            usedLabel={tUsage("usedOfLimit", {
              limit: usage.items.largePdfAnalyses.limit,
              used: usage.items.largePdfAnalyses.current,
            })}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-frosted-blue-100 text-deep-twilight-800">
              <CreditCard aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-deep-twilight-950">
                {tBilling("summary.subscriptionTitle")}
              </h2>
              <p className="text-sm leading-6 text-deep-twilight-700">
                {tBilling("summary.subscriptionDescription")}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-4 py-3">
              <dt className="text-deep-twilight-600">
                {tBilling("summary.currentPlan")}
              </dt>
              <dd className="mt-1 font-semibold text-deep-twilight-950">
                {tPlans(`${usage.plan}.name`)}
              </dd>
            </div>
            <div className="rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-4 py-3">
              <dt className="text-deep-twilight-600">
                {tBilling("summary.status")}
              </dt>
              <dd className="mt-1 font-semibold text-deep-twilight-950">
                {tBilling(`statuses.${currentStatus}`)}
              </dd>
            </div>
            <div className="rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-4 py-3 sm:col-span-2">
              <dt className="text-deep-twilight-600">
                {tBilling("summary.billingPeriod")}
              </dt>
              <dd className="mt-1 font-semibold text-deep-twilight-950">
                {currentPeriodEnd
                  ? tBilling("summary.periodEndsOn", {
                      date: currentPeriodEndLabel,
                    })
                  : tBilling("summary.noPeriod")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-frosted-blue-100 text-deep-twilight-800">
              <LockKeyhole aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-deep-twilight-950">
                {tBilling("actions.title")}
              </h2>
              <p className="text-sm leading-6 text-deep-twilight-700">
                {tBilling("actions.description")}
              </p>
            </div>
          </div>
          <BillingActions
            canManageSubscription={hasStripeCustomer}
            checkoutStatus={checkoutStatus}
            hasBillingProfile={Boolean(profile)}
            plan={usage.plan}
          />
        </div>
      </section>

      <BillingProfileForm initialProfile={profile} />
    </main>
  );
}

type UsageCardProps = {
  feature: BillingFeature;
  item: UsageItem;
  label: string;
  limitReachedLabel: string;
  progressLabel: string;
  remainingLabel: string;
  usedLabel: string;
};

function UsageCard({
  feature,
  item,
  label,
  limitReachedLabel,
  progressLabel,
  remainingLabel,
  usedLabel,
}: UsageCardProps) {
  const isLimitReached = item.current >= item.limit;
  const percentage =
    item.limit > 0
      ? Math.min(100, Math.round((item.current / item.limit) * 100))
      : isLimitReached
        ? 100
        : 0;

  return (
    <div className="min-w-0 rounded-lg border border-frosted-blue-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-frosted-blue-100 text-deep-twilight-800">
          <Gauge aria-hidden="true" className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
            isLimitReached
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-800",
          )}
        >
          {isLimitReached ? (
            <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          <span className="min-w-0">
            {isLimitReached ? limitReachedLabel : remainingLabel}
          </span>
        </span>
      </div>
      <div className="mt-4 min-w-0">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-deep-twilight-700">
              {label}
            </p>
            <p className="text-xl font-semibold text-deep-twilight-950">
              {item.current} / {item.limit}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-deep-twilight-700">
            {percentage}%
          </p>
        </div>
      </div>
      <div
        aria-label={progressLabel}
        className="mt-4 h-2 overflow-hidden rounded-full bg-frosted-blue-100"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            isLimitReached ? "bg-amber-500" : "bg-bright-teal-blue-500",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-medium text-deep-twilight-700">
        {usedLabel}
      </p>
      <span className="sr-only">{feature}</span>
    </div>
  );
}
