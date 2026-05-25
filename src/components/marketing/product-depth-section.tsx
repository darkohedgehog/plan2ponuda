import {
  Boxes,
  ClipboardCheck,
  FileSearch,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

const productDepthItems = [
  { icon: FileSearch, key: "floorPlan" },
  { icon: ClipboardCheck, key: "review" },
  { icon: Boxes, key: "materials" },
  { icon: FileSpreadsheet, key: "exports" },
  { icon: Sparkles, key: "pro" },
] as const;

const badgeKeys = [
  "aiAnalysis",
  "editableSuggestions",
  "exports",
  "proDocumentation",
] as const;

export function ProductDepthSection() {
  const tProductDepth = useTranslations("Marketing.productDepth");
  const title = tProductDepth("title");
  const titleAccent = tProductDepth("titleAccent");
  const [titleBeforeAccent, titleAfterAccent] = title.split(titleAccent);

  return (
    <section className="relative overflow-hidden bg-deep-twilight-950 py-20 text-white sm:py-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,166,255,0.24),transparent_25rem),radial-gradient(circle_at_82%_68%,rgba(0,212,255,0.16),transparent_26rem),linear-gradient(180deg,#010223_0%,#020231_52%,#001724_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(102,229,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(102,229,255,0.18)_1px,transparent_1px)] [background-size:40px_40px]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 top-24 h-64 w-64 rounded-full border border-bright-teal-blue-400/25"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 h-px w-3/4 bg-gradient-to-r from-transparent via-bright-teal-blue-400/50 to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div className="min-w-0 max-w-xl">
          <p className="text-sm font-semibold text-bright-teal-blue-300">
            {tProductDepth("eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white [overflow-wrap:anywhere] sm:text-5xl">
            {titleAfterAccent !== undefined ? (
              <>
                {titleBeforeAccent}
                <span className="text-bright-teal-blue-400">{titleAccent}</span>
                {titleAfterAccent}
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mt-5 text-base leading-7 text-deep-twilight-100/82">
            {tProductDepth("description")}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {badgeKeys.map((badgeKey) => (
              <span
                className="rounded-full border border-bright-teal-blue-300/30 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-bright-teal-blue-100"
                key={badgeKey}
              >
                {tProductDepth(`badges.${badgeKey}`)}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-bright-teal-blue-300/35 bg-bright-teal-blue-500/12 text-bright-teal-blue-300">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-white">
                  {tProductDepth("reviewTitle")}
                </p>
                <p className="mt-2 text-sm leading-6 text-deep-twilight-100/76">
                  {tProductDepth("reviewDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-3xl border border-bright-teal-blue-300/25 bg-white/[0.06] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)] ring-1 ring-white/10 backdrop-blur sm:p-6">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-bright-teal-blue-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-6 top-16 h-px bg-gradient-to-r from-transparent via-bright-teal-blue-300/35 to-transparent"
          />

          <div className="relative flex min-w-0 items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-bright-teal-blue-300">
                {tProductDepth("panelLabel")}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {tProductDepth("panelTitle")}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-bright-teal-blue-300/30 bg-bright-teal-blue-500/10 px-3 py-1 text-xs font-semibold text-bright-teal-blue-100">
              {tProductDepth("panelBadge")}
            </span>
          </div>

          <div className="relative mt-5 grid gap-3">
            {productDepthItems.map(({ icon: Icon, key: itemKey }, index) => (
              <article
                className="group relative grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-deep-twilight-900/72 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.16)] transition-colors hover:border-bright-teal-blue-300/35 sm:grid-cols-[auto_1fr]"
                key={itemKey}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-bright-teal-blue-300/25 bg-bright-teal-blue-500/10 text-bright-teal-blue-300 shadow-[0_0_28px_rgba(0,166,255,0.16)]">
                  <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-xs font-semibold text-bright-teal-blue-300/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="min-w-0 text-base font-semibold text-white">
                      {tProductDepth(`items.${itemKey}.title`)}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-deep-twilight-100/76">
                    {tProductDepth(`items.${itemKey}.description`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
