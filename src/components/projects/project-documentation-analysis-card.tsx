import {
  FileSearch,
  FileText,
  Lock,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { getProjectDocumentationAnalysisState } from "@/lib/billing/project-documentation-analysis";
import { cn } from "@/lib/utils/helpers";
import type { BillingPlan, UsageItem } from "@/types/billing";

type ProjectDocumentationAnalysisCardProps = {
  currentPlan: BillingPlan;
  usage: UsageItem;
};

export function ProjectDocumentationAnalysisCard({
  currentPlan,
  usage,
}: ProjectDocumentationAnalysisCardProps) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const tPlans = useTranslations("Plans");
  const state = getProjectDocumentationAnalysisState(currentPlan);
  const isLocked = state.state === "locked";

  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border bg-white p-4 shadow-sm sm:p-5",
        isLocked
          ? "border-frosted-blue-200"
          : "border-bright-teal-blue-200 bg-bright-teal-blue-50/30",
      )}
    >
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                isLocked
                  ? "bg-frosted-blue-100 text-deep-twilight-800"
                  : "bg-deep-twilight-950 text-turquoise-surf-300",
              )}
            >
              {isLocked ? (
                <Lock aria-hidden="true" className="h-5 w-5" />
              ) : (
                <FileSearch aria-hidden="true" className="h-5 w-5" />
              )}
            </span>
            <FeatureBadge locked={isLocked} />
            <span className="inline-flex min-w-0 rounded-full border border-frosted-blue-200 bg-white px-3 py-1 text-xs font-semibold text-deep-twilight-700">
              {tDocs("currentPlan", {
                plan: tPlans(`${currentPlan}.name`),
              })}
            </span>
          </div>

          <h2 className="mt-4 wrap-break-word text-lg font-semibold text-deep-twilight-950">
            {tDocs("title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-deep-twilight-700">
            {tDocs("description")}
          </p>
          {isLocked ? (
            <p className="mt-3 text-sm font-medium text-deep-twilight-800">
              {tDocs("availableOnPro")}
            </p>
          ) : (
            <p className="mt-3 text-sm font-medium text-bright-teal-blue-800">
              {tDocs("comingSoon")}
            </p>
          )}
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:w-[24rem] lg:shrink-0">
          <div className="min-w-0 rounded-md border border-frosted-blue-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <FileText
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-bright-teal-blue-700"
              />
              <p className="text-xs font-semibold uppercase tracking-wide text-deep-twilight-700/55">
                {tDocs("usageTitle")}
              </p>
            </div>
            <p className="mt-2 text-lg font-semibold text-deep-twilight-950">
              {tDocs("usageValue", {
                limit: usage.limit,
                used: usage.current,
              })}
            </p>
          </div>

          <div className="min-w-0 rounded-md border border-frosted-blue-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Sparkles
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-bright-teal-blue-700"
              />
              <p className="text-xs font-semibold uppercase tracking-wide text-deep-twilight-700/55">
                {tDocs("statusTitle")}
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-deep-twilight-950">
              {isLocked ? tDocs("lockedStatus") : tDocs("betaFeature")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {isLocked ? (
          <Link
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href="/dashboard/billing"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {tDocs("upgradeToPro")}
          </Link>
        ) : (
          <button
            className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-700 opacity-70 shadow-sm sm:w-auto"
            disabled
            type="button"
          >
            <UploadCloud aria-hidden="true" className="h-4 w-4" />
            {tDocs("uploadProjectPdf")}
          </button>
        )}
      </div>
    </section>
  );
}

type FeatureBadgeProps = {
  locked: boolean;
};

function FeatureBadge({ locked }: FeatureBadgeProps) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
        locked
          ? "border-frosted-blue-200 bg-frosted-blue-50 text-deep-twilight-700"
          : "border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-800",
      )}
    >
      {locked ? (
        <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="min-w-0">
        {locked ? tDocs("lockedBadge") : tDocs("proBadge")}
      </span>
    </span>
  );
}
