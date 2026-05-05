import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const previewRooms = ["kitchen", "livingRoom", "bathroom"] as const;

const previewMaterials = [
  { key: "sockets", value: "28" },
  { key: "switches", value: "14" },
  { key: "cable", value: "310 m" },
] as const;

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const tActions = useTranslations("Actions");
  const tCommon = useTranslations("Common");
  const tHero = useTranslations("Marketing.hero");
  const primaryHref = isAuthenticated ? "/dashboard/projects/new" : "/sign-up";

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-48 border-b border-slate-200 bg-slate-50" />
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-700">
            {tCommon("appName")}
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl">
            {tHero("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {tHero("description")}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
              href={primaryHref}
            >
              {tActions("startFirstProject")}
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
              href="/#how-it-works"
            >
              {tActions("seeHowItWorks")}
            </Link>
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}

function ProductPreview() {
  const tPreview = useTranslations("Marketing.hero.preview");

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
      <div className="rounded-md border border-slate-200 bg-slate-950 p-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {tPreview("projectLabel")}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {tPreview("projectName")}
            </p>
          </div>
          <span className="rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
            {tPreview("statusQuoted")}
          </span>
        </div>

        <div className="grid gap-3 py-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-md bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">
                {tPreview("floorPlanReview")}
              </p>
              <p className="text-xs font-semibold text-blue-700">82%</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="col-span-2 h-24 rounded-md border border-slate-200 bg-slate-50 p-2">
                <div className="h-full rounded border border-dashed border-slate-300 bg-white" />
              </div>
              <div className="grid gap-2">
                <div className="rounded-md border border-slate-200 bg-slate-50" />
                <div className="rounded-md border border-slate-200 bg-slate-50" />
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-4/5 rounded-full bg-blue-600" />
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-slate-300">
              {tPreview("quoteTotal")}
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">€8,420</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {tPreview("quoteDescription")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-slate-300">
              {tPreview("detectedRooms")}
            </p>
            <div className="mt-3 grid gap-2">
              {previewRooms.map((roomKey) => (
                <div
                  className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                  key={roomKey}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {tPreview(`rooms.${roomKey}.name`)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tPreview(`rooms.${roomKey}.points`)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {tPreview(`rooms.${roomKey}.status`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-slate-300">
              {tPreview("materialList")}
            </p>
            <div className="mt-3 grid gap-2">
              {previewMaterials.map((material) => (
                <div
                  className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0 last:pb-0"
                  key={material.key}
                >
                  <span className="text-xs text-slate-400">
                    {tPreview(`materials.${material.key}`)}
                  </span>
                  <span className="text-sm font-semibold text-white">{material.value}</span>
                </div>
              ))}
            </div>
            <button
              className="mt-4 h-9 w-full rounded-md bg-white text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-slate-100"
              type="button"
            >
              {tPreview("exportQuote")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
