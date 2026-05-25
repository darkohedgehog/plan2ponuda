import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/helpers";

const planKeys = ["free", "basic", "pro"] as const;
const planFeatureKeys = {
  basic: ["floorPlans", "quotes", "floorPlanAi", "exports"],
  free: ["floorPlan", "quote", "trial"],
  pro: ["floorPlans", "quotes", "documentAnalyses", "candidateReview"],
} as const;

type PlanCtaSectionProps = {
  isAuthenticated: boolean;
};

export function PlanCtaSection({ isAuthenticated }: PlanCtaSectionProps) {
  const tPlanCta = useTranslations("Marketing.planCta");
  const tPricing = useTranslations("Pricing");
  const planCtaHref = isAuthenticated ? "/dashboard/billing" : "/sign-up";
  const title = tPlanCta("title");
  const titleAccent = tPlanCta("titleAccent");
  const [titleBeforeAccent, titleAfterAccent] = title.split(titleAccent);

  function getPlanCtaLabel(planKey: (typeof planKeys)[number]) {
    return isAuthenticated
      ? tPlanCta("primaryCtaAuthenticated")
      : tPlanCta(`plans.${planKey}.cta`);
  }

  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24"
      id="plans"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(0,166,255,0.14),transparent_24rem),radial-gradient(circle_at_86%_56%,rgba(0,212,255,0.12),transparent_25rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_52%,#e9f9fc_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.24] bg-[linear-gradient(rgba(0,99,153,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.12)_1px,transparent_1px)] bg-size-[38px_38px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-bright-teal-blue-200/70"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="min-w-0 max-w-2xl">
            <p className="text-sm font-semibold text-bright-teal-blue-700">
              {tPlanCta("eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-deep-twilight-950 wrap-anywhere sm:text-5xl">
              {titleAfterAccent !== undefined ? (
                <>
                  {titleBeforeAccent}
                  <span className="text-bright-teal-blue-600">
                    {titleAccent}
                  </span>
                  {titleAfterAccent}
                </>
              ) : (
                title
              )}
            </h2>
            <p className="mt-5 text-base leading-7 text-deep-twilight-700">
              {tPlanCta("description")}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-frosted-blue-200 bg-white/82 p-5 shadow-[0_18px_48px_rgba(1,2,35,0.07)] backdrop-blur lg:ml-auto lg:max-w-xl">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bright-teal-blue-50 text-bright-teal-blue-700">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="min-w-0 text-sm leading-6 text-deep-twilight-700">
                {tPlanCta("reviewNote")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {planKeys.map((planKey) => {
            const isRecommended = planKey === "basic";
            const isBeta = planKey === "pro";

            return (
              <article
                className={cn(
                  "relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white/92 p-6 shadow-[0_18px_48px_rgba(1,2,35,0.07)] backdrop-blur",
                  isRecommended
                    ? "border-bright-teal-blue-300 ring-2 ring-bright-teal-blue-100"
                    : "border-frosted-blue-200",
                )}
                key={planKey}
              >
                {isRecommended ? (
                  <div
                    aria-hidden="true"
                    className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-bright-teal-blue-200/70 blur-3xl"
                  />
                ) : null}

                <div className="relative flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-bright-teal-blue-700">
                      {tPlanCta(`plans.${planKey}.title`)}
                    </p>
                    <h3 className="text-2xl font-semibold text-deep-twilight-950">
                      {tPricing(`plans.${planKey}.name`)}
                    </h3>
                  </div>
                  {isRecommended || isBeta ? (
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-semibold",
                        isRecommended
                          ? "bg-deep-twilight-950 text-white"
                          : "border border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-800",
                      )}
                    >
                      {isBeta ? (
                        <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                      ) : null}
                      {isRecommended
                        ? tPricing("plans.basic.badge")
                        : tPlanCta("plans.pro.badge")}
                    </span>
                  ) : null}
                </div>

                <p className="relative mt-4 text-sm leading-6 text-deep-twilight-700">
                  {tPlanCta(`plans.${planKey}.description`)}
                </p>

                <p className="relative mt-6 text-3xl font-semibold text-deep-twilight-950">
                  {tPricing(`plans.${planKey}.price`)}
                </p>

                <ul className="relative mt-6 grid gap-3 text-sm leading-6 text-deep-twilight-700">
                  {planFeatureKeys[planKey].map((featureKey) => (
                    <li className="flex min-w-0 gap-2" key={featureKey}>
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 shrink-0 text-bright-teal-blue-700"
                      />
                      <span className="min-w-0">
                        {tPricing(`plans.${planKey}.features.${featureKey}`)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="relative mt-auto pt-8">
                  <Link
                    className={cn(
                      "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2",
                      isRecommended
                        ? "bg-bright-teal-blue-500 text-deep-twilight-950 shadow-[0_18px_40px_rgba(0,166,255,0.22)] hover:bg-turquoise-surf-400"
                        : "border border-frosted-blue-200 bg-white text-deep-twilight-900 hover:bg-frosted-blue-50",
                    )}
                    href={planCtaHref}
                  >
                    {getPlanCtaLabel(planKey)}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
