import {
  ClipboardCheck,
  FileSearch,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

const capabilityKeys = [
  "floorPlanAnalysis",
  "projectDocumentation",
  "reviewWorkflow",
  "exports",
] as const;

const capabilityIcons = {
  exports: FileSpreadsheet,
  floorPlanAnalysis: FileSearch,
  projectDocumentation: ClipboardCheck,
  reviewWorkflow: ShieldCheck,
} as const;

export function ProductDepthSection() {
  const tCapabilities = useTranslations("Marketing.capabilities");

  return (
    <section className="border-y border-frosted-blue-200 bg-white py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-deep-twilight-950 sm:text-4xl">
            {tCapabilities("title")}
          </h2>
          <p className="mt-5 text-base leading-7 text-deep-twilight-700">
            {tCapabilities("description")}
          </p>
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">{tCapabilities("safetyTitle")}</p>
            <p className="mt-1">{tCapabilities("safetyDescription")}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {capabilityKeys.map((capabilityKey) => {
            const Icon = capabilityIcons[capabilityKey];

            return (
              <article
                className="min-w-0 rounded-md border border-frosted-blue-200 bg-frosted-blue-50/70 p-5"
                key={capabilityKey}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-deep-twilight-950 text-turquoise-surf-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-deep-twilight-950">
                  {tCapabilities(`items.${capabilityKey}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
                  {tCapabilities(`items.${capabilityKey}.description`)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
