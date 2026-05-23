import { FileCheck2, Sparkles, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";

const workflowSteps = [
  { icon: UploadCloud, stepKey: "upload" },
  { icon: Sparkles, stepKey: "analyze" },
  { icon: FileCheck2, stepKey: "quote" },
] as const;

export function WorkflowSection() {
  const tWorkflow = useTranslations("Marketing.howItWorks");
  const title = tWorkflow("title");
  const [titleBeforeBrand, titleAfterBrand] = title.split("Ploro AI");

  return (
    <section
      className="relative overflow-hidden bg-deep-twilight-950 py-20 text-white sm:py-24"
      id="how-it-works"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(0,166,255,0.26),transparent_26rem),radial-gradient(circle_at_78%_36%,rgba(0,212,255,0.20),transparent_22rem),linear-gradient(180deg,#010223_0%,#020231_56%,#001724_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-bright-teal-blue-500/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute -left-28 bottom-0 h-60 w-[32rem] rotate-[-12deg] rounded-full border-t border-bright-teal-blue-500/20"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-12 h-64 w-[34rem] rotate-[16deg] rounded-full border-b border-turquoise-surf-500/15"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {titleAfterBrand !== undefined ? (
              <>
                {titleBeforeBrand}
                <span className="text-bright-teal-blue-400">Ploro AI</span>
                {titleAfterBrand}
              </>
            ) : (
              title
            )}
          </h2>
        </div>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden="true"
            className="absolute left-[18%] right-[18%] top-16 hidden h-0.5 bg-[radial-gradient(circle,#00a6ff_1.7px,transparent_2px)] bg-[length:16px_4px] opacity-80 md:block"
          />

          {workflowSteps.map(({ icon: Icon, stepKey }, index) => (
            <article
              className="relative flex min-w-0 flex-col items-center text-center"
              key={stepKey}
            >
              <div
                aria-hidden="true"
                className="absolute top-12 h-14 w-24 rounded-full bg-bright-teal-blue-500/20 blur-2xl"
              />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-bright-teal-blue-300/45 bg-white/[0.06] shadow-[0_0_36px_rgba(0,166,255,0.34),inset_0_0_28px_rgba(0,212,255,0.10)] ring-1 ring-white/10 backdrop-blur">
                <span className="absolute right-3 top-3 text-xs font-semibold text-bright-teal-blue-300/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon
                  aria-hidden="true"
                  className="h-11 w-11 text-white drop-shadow-[0_0_14px_rgba(0,166,255,0.95)]"
                  strokeWidth={1.9}
                />
              </div>
              <h3 className="mt-7 text-xl font-semibold text-white">
                {tWorkflow(`steps.${stepKey}.title`)}
              </h3>
              <p className="mt-3 max-w-64 text-sm leading-6 text-deep-twilight-100/82">
                {tWorkflow(`steps.${stepKey}.description`)}
              </p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center text-xl font-medium text-white sm:text-2xl">
          {tWorkflow("tagline")}
        </p>
      </div>
    </section>
  );
}
