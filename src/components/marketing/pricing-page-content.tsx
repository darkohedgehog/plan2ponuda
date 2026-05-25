import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
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
  free: ["floorPlan", "quote", "trial"],
  pro: [
    "floorPlans",
    "quotes",
    "documentAnalyses",
    "projectPdfExtraction",
    "candidateReview",
    "exports",
  ],
} as const;

const noteKeys = [
  { icon: ShieldCheck, key: "aiReview" },
  { icon: CreditCard, key: "stripePortal" },
  { icon: CheckCircle2, key: "billingProfile" },
] as const;

type PricingPageContentProps = {
  isAuthenticated: boolean;
};

export function PricingPageContent({
  isAuthenticated,
}: PricingPageContentProps) {
  const tPricing = useTranslations("Pricing");
  const title = tPricing("hero.title");
  const titleAccent = tPricing("hero.titleAccent");
  const [titleBeforeAccent, titleAfterAccent] = title.split(titleAccent);

  function getPlanCta(planKey: (typeof planKeys)[number]) {
    if (!isAuthenticated) {
      return {
        href: "/sign-up",
        label: tPricing(
          planKey === "free" ? "cta.startFree" : "cta.createAccount",
        ),
      };
    }

    if (planKey === "free") {
      return {
        href: "/dashboard/projects",
        label: tPricing("cta.openProjects"),
      };
    }

    return {
      href: "/dashboard/billing",
      label: tPricing("cta.manageBilling"),
    };
  }

  return (
    <main className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(0,166,255,0.15),transparent_24rem),radial-gradient(circle_at_84%_24%,rgba(0,212,255,0.13),transparent_26rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_48%,#e9f9fc_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.26] [background-image:linear-gradient(rgba(0,99,153,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.12)_1px,transparent_1px)] [background-size:38px_38px]"
      />

      <section className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-bright-teal-blue-700">
            {tPricing("hero.eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-deep-twilight-950 [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
            {titleAfterAccent !== undefined ? (
              <>
                {titleBeforeAccent}
                <span className="text-bright-teal-blue-600">{titleAccent}</span>
                {titleAfterAccent}
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-deep-twilight-700 sm:text-lg">
            {tPricing("hero.description")}
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {planKeys.map((planKey) => {
            const isRecommended = planKey === "basic";
            const isBeta = planKey === "pro";
            const cta = getPlanCta(planKey);

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
                      {tPricing(`plans.${planKey}.fit`)}
                    </p>
                    <h2 className="text-2xl font-semibold text-deep-twilight-950">
                      {tPricing(`plans.${planKey}.name`)}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
                      {tPricing(`plans.${planKey}.description`)}
                    </p>
                  </div>
                  {isRecommended || isBeta ? (
                    <span
                      className={cn(
                        "shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-semibold",
                        isRecommended
                          ? "bg-deep-twilight-950 text-white"
                          : "border border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-800",
                      )}
                    >
                      {tPricing(`plans.${planKey}.badge`)}
                    </span>
                  ) : null}
                </div>

                <p className="relative mt-7 text-4xl font-semibold text-deep-twilight-950">
                  {tPricing(`plans.${planKey}.price`)}
                </p>

                <ul className="relative mt-7 grid gap-3 text-sm leading-6 text-deep-twilight-700">
                  {planFeatureKeys[planKey].map((featureKey) => (
                    <li className="flex gap-2" key={featureKey}>
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 shrink-0 text-bright-teal-blue-700"
                      />
                      <span>
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
                    href={cta.href}
                  >
                    {cta.label}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-frosted-blue-200 bg-white/80 p-4 text-sm leading-6 text-deep-twilight-700 shadow-sm backdrop-blur md:grid-cols-3">
          {noteKeys.map(({ icon: Icon, key }) => (
            <div className="flex min-w-0 gap-3" key={key}>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bright-teal-blue-50 text-bright-teal-blue-700">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="min-w-0">{tPricing(`notes.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
