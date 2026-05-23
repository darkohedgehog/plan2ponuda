import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/helpers";

const planKeys = ["free", "basic", "pro"] as const;
const planFeatureKeys = {
  basic: ["floorPlans", "quotes", "floorPlanAi", "exports"],
  free: ["floorPlan", "quote", "exports", "trial"],
  pro: ["floorPlans", "quotes", "documentAnalyses", "candidateReview"],
} as const;

type PlanCtaSectionProps = {
  isAuthenticated: boolean;
};

export function PlanCtaSection({ isAuthenticated }: PlanCtaSectionProps) {
  const tActions = useTranslations("Actions");
  const tPricing = useTranslations("Pricing");
  const href = isAuthenticated ? "/dashboard/billing" : "/pricing";

  return (
    <section className="bg-frosted-blue-50 py-20" id="plans">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-deep-twilight-950 sm:text-4xl">
            {tPricing("landingTitle")}
          </h2>
          <p className="mt-4 text-base leading-7 text-deep-twilight-700">
            {tPricing("landingDescription")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
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
                  <h3 className="text-xl font-semibold text-deep-twilight-950">
                    {tPricing(`plans.${planKey}.name`)}
                  </h3>
                  <p className="mt-1 text-sm text-deep-twilight-700">
                    {tPricing(`plans.${planKey}.fit`)}
                  </p>
                </div>
                {planKey === "pro" ? (
                  <span className="rounded-full border border-bright-teal-blue-200 bg-bright-teal-blue-50 px-2.5 py-1 text-xs font-semibold text-bright-teal-blue-800">
                    {tPricing("beta")}
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-tight text-deep-twilight-950">
                {tPricing(`plans.${planKey}.price`)}
              </p>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-deep-twilight-700">
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
                  "mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2",
                  planKey === "pro"
                    ? "bg-deep-twilight-950 text-white hover:bg-deep-twilight-800"
                    : "border border-frosted-blue-200 bg-white text-deep-twilight-900 hover:bg-frosted-blue-50",
                )}
                href={href}
              >
                {isAuthenticated ? tActions("manageBilling") : tPricing("viewPlan")}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
