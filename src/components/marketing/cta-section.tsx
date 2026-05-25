import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, FileText, Zap } from "lucide-react";

import { Link } from "@/i18n/navigation";

const checklistItems = ["upload", "estimate", "export"] as const;

type CtaSectionProps = {
  isAuthenticated: boolean;
};

export function CtaSection({ isAuthenticated }: CtaSectionProps) {
  const tFinalCta = useTranslations("Marketing.finalCta");
  const startProjectHref = isAuthenticated ? "/dashboard/projects" : "/sign-up";
  const title = tFinalCta("title");
  const titleAccent = tFinalCta("titleAccent");
  const [titleBeforeAccent, titleAfterAccent] = title.split(titleAccent);

  return (
    <section className="relative overflow-hidden bg-white px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_80%_28%,rgba(0,166,255,0.16),transparent_24rem),radial-gradient(circle_at_18%_86%,rgba(0,212,255,0.10),transparent_22rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_64%,#e9f9fc_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.26] [background-image:linear-gradient(rgba(0,99,153,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.12)_1px,transparent_1px)] [background-size:38px_38px]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 overflow-hidden rounded-3xl border border-frosted-blue-200 bg-white/90 p-6 shadow-[0_28px_90px_rgba(1,2,35,0.10)] backdrop-blur sm:p-8 lg:grid-cols-[1fr_0.86fr] lg:p-10">
        <div className="min-w-0">
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-deep-twilight-950 sm:text-5xl">
            {titleAfterAccent !== undefined ? (
              <>
                {titleBeforeAccent}
                <span className="text-bright-teal-blue-600">{titleAccent}</span>
                {titleAfterAccent}
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-deep-twilight-700">
            {tFinalCta("description")}
          </p>

          <div className="mt-7 grid gap-3">
            {checklistItems.map((itemKey) => (
              <div className="flex min-w-0 items-center gap-3" key={itemKey}>
                <CheckCircle2
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-bright-teal-blue-600"
                />
                <span className="min-w-0 text-sm font-semibold text-deep-twilight-900">
                  {tFinalCta(`checklist.${itemKey}`)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-bright-teal-blue-500 px-6 text-sm font-semibold text-deep-twilight-950 shadow-[0_18px_42px_rgba(0,166,255,0.25)] outline-none transition-colors hover:bg-turquoise-surf-400 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2 sm:w-auto"
              href={startProjectHref}
            >
              <Zap aria-hidden="true" className="h-4 w-4" />
              {tFinalCta("primaryCta")}
            </Link>
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-6 text-sm font-semibold text-deep-twilight-900 shadow-sm outline-none transition-colors hover:bg-frosted-blue-50 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2 sm:w-auto"
              href="/pricing"
            >
              {tFinalCta("secondaryCta")}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-bright-teal-blue-100 bg-frosted-blue-50 shadow-inner">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(0,99,153,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.13)_1px,transparent_1px)] [background-size:24px_24px]"
          />
          <div
            aria-hidden="true"
            className="absolute right-8 top-8 h-36 w-36 rounded-full border border-bright-teal-blue-300/70"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-8 h-28 w-52 rotate-[-8deg] rounded-2xl border-2 border-bright-teal-blue-400/70 bg-white/70"
          />
          <div className="absolute left-6 top-6 rounded-2xl border border-frosted-blue-200 bg-white/92 p-4 shadow-[0_18px_42px_rgba(1,2,35,0.10)]">
            <FileText
              aria-hidden="true"
              className="h-8 w-8 text-bright-teal-blue-600"
            />
            <div
              aria-hidden="true"
              className="mt-4 h-2 w-36 rounded-full bg-deep-twilight-950/80"
            />
            <div
              aria-hidden="true"
              className="mt-3 h-2 w-28 rounded-full bg-bright-teal-blue-300"
            />
            <div
              aria-hidden="true"
              className="mt-3 h-2 w-32 rounded-full bg-frosted-blue-300"
            />
          </div>
          <div className="absolute bottom-6 right-6 rounded-2xl border border-bright-teal-blue-200 bg-white px-4 py-3 text-sm font-semibold text-deep-twilight-950 shadow-[0_18px_44px_rgba(0,99,153,0.18)]">
            PDF / Excel
          </div>
        </div>
      </div>
    </section>
  );
}
