import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Link } from "@/i18n/navigation";

const heroPoints = ["upload", "rooms", "export"] as const;

const previewRooms = [
  {
    key: "livingRoom",
    area: "24.5 m²",
    colorClassName: "bg-bright-teal-blue-500",
  },
  { key: "kitchen", area: "15.2 m²", colorClassName: "bg-emerald-400" },
  { key: "bathroom", area: "6.8 m²", colorClassName: "bg-amber-300" },
] as const;

const quoteRows = [
  { key: "materials", value: "€5,640" },
  { key: "labor", value: "€2,180" },
  { key: "other", value: "€600" },
] as const;

const previewMaterials = [
  { key: "sockets", value: "28" },
  { key: "switches", value: "14" },
  { key: "cable", value: "310 m" },
] as const;

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const tCommon = useTranslations("Common");
  const tHero = useTranslations("Marketing.hero");
  const primaryHref = isAuthenticated ? "/dashboard/projects" : "/sign-up";
  const title = tHero("title");
  const titleAccent = tHero("titleAccent");
  const [titleBeforeAccent, titleAfterAccent] = title.split(titleAccent);

  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(0,166,255,0.18),transparent_26rem),radial-gradient(circle_at_18%_72%,rgba(0,212,255,0.12),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_58%,#e9f9fc_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.34] [background-image:linear-gradient(rgba(0,99,153,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.13)_1px,transparent_1px)] [background-size:42px_42px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-24 h-72 w-72 rounded-full border border-bright-teal-blue-200/70"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 h-px w-[72rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-bright-teal-blue-300/70 to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-7xl min-w-0 items-center gap-12 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="w-full min-w-0 max-w-2xl">
          <h1 className="max-w-[20rem] break-words text-4xl font-semibold leading-[1.02] tracking-tight text-deep-twilight-950 sm:max-w-3xl sm:text-6xl lg:text-7xl">
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
          <p className="mt-6 max-w-[21rem] break-words text-lg leading-8 text-deep-twilight-700 sm:max-w-2xl">
            {tHero("description")}
          </p>
          <div className="mt-7 grid max-w-2xl gap-3 text-sm font-medium text-deep-twilight-800 sm:grid-cols-3">
            {heroPoints.map((pointKey) => (
              <div className="flex min-w-0 items-center gap-2" key={pointKey}>
                <CheckCircle2
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-bright-teal-blue-600"
                />
                <span className="min-w-0">{tHero(`points.${pointKey}`)}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-[21rem] break-words text-sm leading-6 text-deep-twilight-600 sm:max-w-2xl">
            <ShieldCheck
              aria-hidden="true"
              className="mr-2 inline h-4 w-4 text-bright-teal-blue-600"
            />
            {tHero("reviewNote")}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-bright-teal-blue-500 px-6 text-sm font-semibold text-deep-twilight-950 shadow-[0_18px_42px_rgba(0,166,255,0.28)] outline-none transition-colors hover:bg-turquoise-surf-400 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2 sm:w-auto"
              href={primaryHref}
            >
              <Zap aria-hidden="true" className="h-4 w-4" />
              {isAuthenticated
                ? tHero("primaryCtaAuthenticated")
                : tHero("primaryCta")}
            </Link>
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-6 text-sm font-semibold text-deep-twilight-900 shadow-sm outline-none transition-colors hover:bg-frosted-blue-50 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2 sm:w-auto"
              href="/pricing"
            >
              {tHero("secondaryCta")}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <ProductPreview appName={tCommon("appName")} />
      </div>
    </section>
  );
}

function ProductPreview({ appName }: { appName: string }) {
  const tMockup = useTranslations("Marketing.hero.mockup");

  return (
    <div className="relative mx-auto w-full max-w-[22rem] min-w-0 sm:max-w-2xl lg:mr-0">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2.5rem] bg-bright-teal-blue-500/18 blur-3xl"
      />
      <div className="relative overflow-hidden rounded-3xl border border-frosted-blue-200 bg-white/92 p-3 shadow-[0_28px_80px_rgba(1,2,35,0.16)] ring-1 ring-white/80 backdrop-blur sm:p-5">
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-turquoise-surf-200/35 blur-2xl" aria-hidden="true" />
        <div className="relative rounded-2xl border border-frosted-blue-200 bg-white p-4 sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-frosted-blue-100 pb-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-bright-teal-blue-700">
                {appName}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-deep-twilight-950">
                {tMockup("projectName")}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-bright-teal-blue-200 bg-bright-teal-blue-50 px-3 py-1 text-xs font-semibold text-bright-teal-blue-800">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              {tMockup("detectedRooms")}
            </span>
          </div>

          <div className="grid min-w-0 gap-4 pt-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="min-w-0">
              <div className="relative aspect-[1.18] overflow-hidden rounded-2xl border border-bright-teal-blue-100 bg-frosted-blue-50 shadow-inner">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(0,99,153,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.13)_1px,transparent_1px)] [background-size:20px_20px]"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-[10%] top-[12%] h-[40%] w-[50%] rounded-lg border-2 border-bright-teal-blue-400/70 bg-bright-teal-blue-100/55"
                />
                <div
                  aria-hidden="true"
                  className="absolute right-[9%] top-[12%] h-[40%] w-[25%] rounded-lg border-2 border-emerald-300/70 bg-emerald-100/60"
                />
                <div
                  aria-hidden="true"
                  className="absolute bottom-[12%] left-[10%] h-[29%] w-[34%] rounded-lg border-2 border-amber-300/80 bg-amber-100/65"
                />
                <div
                  aria-hidden="true"
                  className="absolute bottom-[12%] right-[9%] h-[29%] w-[40%] rounded-lg border-2 border-frosted-blue-300/80 bg-white/70"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[16%] top-[52%] h-0.5 bg-deep-twilight-900/45"
                />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-deep-twilight-800 shadow-sm">
                  {tMockup("blueprintLabel")}
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-deep-twilight-700">
                {tMockup("rooms")}
              </p>
              <div className="mt-2 grid gap-2">
                {previewRooms.map((room) => (
                  <div
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-frosted-blue-100 bg-white px-3 py-2 shadow-sm"
                    key={room.key}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${room.colorClassName}`}
                      />
                      <span className="truncate text-xs font-semibold text-deep-twilight-900">
                        {tMockup(`roomList.${room.key}`)}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-deep-twilight-600">
                      {room.area}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-frosted-blue-200 bg-white p-4 shadow-[0_18px_46px_rgba(1,2,35,0.10)]">
              <p className="text-xs font-semibold text-deep-twilight-600">
                {tMockup("quoteSummary")}
              </p>
              <p className="mt-2 text-sm font-medium text-deep-twilight-700">
                {tMockup("totalEstimate")}
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-deep-twilight-950 sm:text-4xl">
                €8,420
              </p>
              <div className="mt-4 grid gap-2">
                {quoteRows.map((row) => (
                  <div
                    className="flex items-center justify-between gap-3 border-b border-frosted-blue-100 pb-2 last:border-0 last:pb-0"
                    key={row.key}
                  >
                    <span className="min-w-0 truncate text-xs text-deep-twilight-600">
                      {tMockup(row.key)}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-deep-twilight-900">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-frosted-blue-50 p-3">
                <p className="text-xs font-semibold text-deep-twilight-800">
                  {tMockup("materialSuggestions")}
                </p>
                <div className="mt-3 grid gap-2">
                  {previewMaterials.map((material) => (
                    <div
                      className="flex items-center justify-between gap-2 text-xs"
                      key={material.key}
                    >
                      <span className="min-w-0 truncate text-deep-twilight-600">
                        {tMockup(`materialItems.${material.key}`)}
                      </span>
                      <span className="shrink-0 font-semibold text-deep-twilight-900">
                        {material.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-deep-twilight-950 px-3 py-2 text-xs font-semibold text-white">
                  <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                  PDF
                </span>
                <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-frosted-blue-200 bg-white px-3 py-2 text-xs font-semibold text-deep-twilight-900">
                  <FileSpreadsheet aria-hidden="true" className="h-3.5 w-3.5" />
                  Excel
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 left-5 hidden rounded-2xl border border-bright-teal-blue-200 bg-white px-4 py-3 text-xs font-semibold text-deep-twilight-900 shadow-[0_18px_50px_rgba(0,99,153,0.20)] sm:flex sm:items-center sm:gap-2">
        <Download aria-hidden="true" className="h-4 w-4 text-bright-teal-blue-600" />
        {tMockup("exportReady")}
      </div>
    </div>
  );
}
