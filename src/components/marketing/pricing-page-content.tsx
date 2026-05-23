import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/helpers";

const planKeys = ["free", "basic", "pro"] as const;
const planFeatureKeys = {
  basic: [
    "floorPlans",
    "quotes",
    "floorPlanAi",
    "exports",
    "stripeSubscription",
    "cancelAnytime",
  ],
  free: ["floorPlan", "quote", "exports", "trial"],
  pro: [
    "floorPlans",
    "quotes",
    "documentAnalyses",
    "projectPdfExtraction",
    "candidateReview",
    "exports",
  ],
} as const;

type PricingPageContentProps = {
  isAuthenticated: boolean;
};

export function PricingPageContent({
  isAuthenticated,
}: PricingPageContentProps) {
  const tActions = useTranslations("Actions");
  const tPricing = useTranslations("Pricing");
  const ctaHref = isAuthenticated ? "/dashboard/billing" : "/sign-up";
  const ctaLabel = isAuthenticated
    ? tActions("manageBilling")
    : tActions("createAccount");

  return (
    <main className="bg-frosted-blue-50">
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-deep-twilight-950 sm:text-5xl">
            {tPricing("page.title")}
          </h1>
          <p className="mt-5 text-base leading-7 text-deep-twilight-700 sm:text-lg">
            {tPricing("page.description")}
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {planKeys.map((planKey) => (
            <article
              className={cn(
                "flex min-w-0 flex-col rounded-md border bg-white p-6 shadow-sm",
                planKey === "pro"
                  ? "border-deep-twilight-300 ring-1 ring-deep-twilight-100"
                  : "border-frosted-blue-200",
              )}
              key={planKey}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-deep-twilight-950">
                    {tPricing(`plans.${planKey}.name`)}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
                    {tPricing(`plans.${planKey}.description`)}
                  </p>
                </div>
                {planKey === "pro" ? (
                  <span className="rounded-full border border-bright-teal-blue-200 bg-bright-teal-blue-50 px-2.5 py-1 text-xs font-semibold text-bright-teal-blue-800">
                    {tPricing("beta")}
                  </span>
                ) : null}
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight text-deep-twilight-950">
                {tPricing(`plans.${planKey}.price`)}
              </p>
              <p className="mt-2 text-sm text-deep-twilight-700">
                {tPricing(`plans.${planKey}.fit`)}
              </p>

              <ul className="mt-6 grid gap-3 text-sm leading-6 text-deep-twilight-700">
                {planFeatureKeys[planKey].map((featureKey) => (
                  <li className="flex gap-2" key={featureKey}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-bright-teal-blue-700"
                    />
                    <span>{tPricing(`plans.${planKey}.features.${featureKey}`)}</span>
                  </li>
                ))}
              </ul>

              <Link
                className={cn(
                  "mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2",
                  planKey === "pro"
                    ? "bg-deep-twilight-950 text-white hover:bg-deep-twilight-800"
                    : "border border-frosted-blue-200 bg-white text-deep-twilight-900 hover:bg-frosted-blue-50",
                )}
                href={ctaHref}
              >
                {ctaLabel}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">{tPricing("reviewNote.title")}</p>
          <p className="mt-1">{tPricing("reviewNote.description")}</p>
        </div>
      </section>
    </main>
  );
}
