import { CreditCard, Gauge, LockKeyhole } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BillingActions } from "@/components/billing/billing-actions";
import { BillingProfileForm } from "@/components/billing/billing-profile-form";
import { redirect } from "@/i18n/navigation";
import { resolveLocale, type Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getBillingProfile,
  getSubscription,
  getUsageForCurrentPeriod,
} from "@/server/services/billing-service";
import type { BillingFeature, UsageItem } from "@/types/billing";

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

  return new Intl.DateTimeFormat(locale).format(new Date(value));
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
  const currentStatus =
    usage.plan === "free" ? "free" : subscription?.status ?? "free";
  const checkoutStatus =
    checkout === "success" || checkout === "cancelled" ? checkout : null;

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bright-teal-blue-700">
          {tBilling("page.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-deep-twilight-950">
          {tBilling("page.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-deep-twilight-700">
          {tBilling("page.description")}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-deep-twilight-950 text-turquoise-surf-300">
              <CreditCard aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-deep-twilight-700">
                {tBilling("summary.currentPlan")}
              </p>
              <p className="text-xl font-semibold text-deep-twilight-950">
                {tPlans(`${usage.plan}.name`)}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-deep-twilight-700">
                {tBilling("summary.status")}
              </dt>
              <dd className="font-semibold text-deep-twilight-950">
                {tBilling(`statuses.${currentStatus}`)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-deep-twilight-700">
                {tBilling("summary.periodEnd")}
              </dt>
              <dd className="font-semibold text-deep-twilight-950">
                {formatDate(subscription?.currentPeriodEnd ?? null, locale)}
              </dd>
            </div>
          </dl>
        </div>

        <UsageCard
          feature="floorPlans"
          item={usage.items.floorPlans}
          label={tUsage("floorPlans")}
          limitReachedLabel={tUsage("limitReached")}
          remainingLabel={tUsage("remaining", {
            count: Math.max(
              0,
              usage.items.floorPlans.limit - usage.items.floorPlans.current,
            ),
          })}
        />
        <UsageCard
          feature="quotes"
          item={usage.items.quotes}
          label={tUsage("quotes")}
          limitReachedLabel={tUsage("limitReached")}
          remainingLabel={tUsage("remaining", {
            count: Math.max(0, usage.items.quotes.limit - usage.items.quotes.current),
          })}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <UsageCard
          feature="largePdfAnalyses"
          item={usage.items.largePdfAnalyses}
          label={tUsage("largePdfAnalyses")}
          limitReachedLabel={tUsage("limitReached")}
          remainingLabel={tUsage("remaining", {
            count: Math.max(
              0,
              usage.items.largePdfAnalyses.limit -
                usage.items.largePdfAnalyses.current,
            ),
          })}
        />
        <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-frosted-blue-100 text-deep-twilight-800">
              <LockKeyhole aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-deep-twilight-950">
                {tBilling("actions.title")}
              </h2>
              <p className="text-sm leading-6 text-deep-twilight-700">
                {tBilling("actions.description")}
              </p>
            </div>
          </div>
          <BillingActions
            canManageSubscription={Boolean(subscription?.stripeCustomerId)}
            checkoutStatus={checkoutStatus}
            hasBillingProfile={Boolean(profile)}
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
  remainingLabel: string;
};

function UsageCard({
  feature,
  item,
  label,
  limitReachedLabel,
  remainingLabel,
}: UsageCardProps) {
  const percentage =
    item.limit > 0 ? Math.min(100, Math.round((item.current / item.limit) * 100)) : 0;
  const isLimitReached = item.current >= item.limit;

  return (
    <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-frosted-blue-100 text-deep-twilight-800">
          <Gauge aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-deep-twilight-700">{label}</p>
          <p className="text-xl font-semibold text-deep-twilight-950">
            {item.current} / {item.limit}
          </p>
        </div>
      </div>
      <div
        aria-label={feature}
        className="mt-5 h-2 overflow-hidden rounded-full bg-frosted-blue-100"
      >
        <div
          className="h-full rounded-full bg-bright-teal-blue-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-medium text-deep-twilight-700">
        {isLimitReached ? limitReachedLabel : remainingLabel}
      </p>
    </div>
  );
}
