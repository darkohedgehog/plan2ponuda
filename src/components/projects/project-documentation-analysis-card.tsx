import {
  FileSearch,
  FileText,
  Lock,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getProjectDocumentAnalysisUiState } from "@/lib/billing/project-document-analysis-view";
import { getProjectDocumentationAnalysisState } from "@/lib/billing/project-documentation-analysis";
import { cn } from "@/lib/utils/helpers";
import type { BillingPlan, UsageItem } from "@/types/billing";
import type {
  ProjectDocument,
  ProjectDocumentAnalysisResult,
} from "@/types/project-document";
import {
  ProjectDocumentAnalyzeButton,
  ProjectDocumentDeleteButton,
  ProjectDocumentUploadForm,
} from "./project-document-upload-form";

type ProjectDocumentationAnalysisCardProps = {
  currentPlan: BillingPlan;
  documents: ProjectDocument[];
  projectId: string;
  usage: UsageItem;
};

export function ProjectDocumentationAnalysisCard({
  currentPlan,
  documents,
  projectId,
  usage,
}: ProjectDocumentationAnalysisCardProps) {
  const locale = useLocale();
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
              {tDocs("readyForFutureAnalysis")}
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
              {isLocked ? tDocs("lockedStatus") : tDocs("readyForFutureAnalysis")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 min-w-0">
        {isLocked ? (
          <Link
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href="/dashboard/billing"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {tDocs("upgradeToPro")}
          </Link>
        ) : (
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-w-0 rounded-md border border-frosted-blue-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-deep-twilight-950">
                {tDocs("uploadProjectPdf")}
              </h3>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-deep-twilight-700">
                <li>{tDocs("pdfOnly")}</li>
                <li>{tDocs("max20Mb")}</li>
              </ul>
              <div className="mt-4">
                <ProjectDocumentUploadForm projectId={projectId} />
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-deep-twilight-950">
                {tDocs("uploadedDocuments")}
              </h3>
              {documents.length === 0 ? (
                <p className="mt-3 rounded-md border border-dashed border-frosted-blue-300 bg-white px-4 py-5 text-sm leading-6 text-deep-twilight-700">
                  {tDocs("noDocumentsUploaded")}
                </p>
              ) : (
                <ul className="mt-3 grid min-w-0 gap-3">
                  {documents.map((document) => (
                    <ProjectDocumentListItem
                      document={document}
                      key={document.id}
                      locale={locale}
                      projectId={projectId}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type ProjectDocumentListItemProps = {
  document: ProjectDocument;
  locale: string;
  projectId: string;
};

function ProjectDocumentListItem({
  document,
  locale,
  projectId,
}: ProjectDocumentListItemProps) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const documentState = getProjectDocumentAnalysisUiState(document.status);
  const analysis = document.latestAnalysis?.parsedResponse ?? null;

  return (
    <li className="min-w-0 rounded-md border border-frosted-blue-200 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-deep-twilight-950">
            {document.fileName}
          </p>
          <p className="mt-1 text-xs text-deep-twilight-700/70">
            {tDocs("documentMeta", {
              date: formatDate(document.createdAt, locale),
              size: formatFileSize(document.sizeBytes, locale),
            })}
          </p>
          <span className="mt-3 inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {tDocs(`statuses.${document.status}`)}
          </span>
          {documentState.showSummary && analysis ? (
            <ProjectDocumentAnalysisSummary
              analysis={analysis}
              locale={locale}
            />
          ) : documentState.state === "analyzed" ? (
            <p className="mt-3 text-sm text-deep-twilight-700">
              {tDocs("analysisCompleted")}
            </p>
          ) : documentState.state === "failed" ? (
            <p className="mt-3 text-sm text-red-700">
              {tDocs("analysisFailed")}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-2">
          {documentState.canAnalyze ? (
            <ProjectDocumentAnalyzeButton
              documentId={document.id}
              projectId={projectId}
            />
          ) : documentState.state === "analyzing" ? (
            <Button disabled type="button">
              <FileSearch aria-hidden="true" className="h-4 w-4" />
              {tDocs("analyzingDocument")}
            </Button>
          ) : null}
          <ProjectDocumentDeleteButton
            documentId={document.id}
            projectId={projectId}
          />
        </div>
      </div>
    </li>
  );
}

type ProjectDocumentAnalysisSummaryProps = {
  analysis: ProjectDocumentAnalysisResult;
  locale: string;
};

function ProjectDocumentAnalysisSummary({
  analysis,
  locale,
}: ProjectDocumentAnalysisSummaryProps) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const systems = analysis.detectedSystems
    .map((system) => system.replace(/_/g, " "))
    .join(", ");

  return (
    <div className="mt-4 min-w-0 rounded-md border border-frosted-blue-200 bg-frosted-blue-50 p-3">
      <h4 className="text-sm font-semibold text-deep-twilight-950">
        {tDocs("extractedSummary")}
      </h4>
      <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
        {analysis.projectSummary}
      </p>
      <dl className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
        <SummaryMetric
          label={tDocs("detectedSystems")}
          value={systems || tDocs("noneDetected")}
        />
        <SummaryMetric
          label={tDocs("materialCandidates")}
          value={formatInteger(analysis.materialCandidates.length, locale)}
        />
        <SummaryMetric
          label={tDocs("laborCandidates")}
          value={formatInteger(analysis.laborCandidates.length, locale)}
        />
        <SummaryMetric
          label={tDocs("overallConfidence")}
          value={formatConfidence(analysis.overallConfidence, locale)}
        />
        <SummaryMetric
          label={tDocs("assumptions")}
          value={formatInteger(analysis.assumptions.length, locale)}
        />
        <SummaryMetric
          label={tDocs("missingInformation")}
          value={formatInteger(analysis.missingInformation.length, locale)}
        />
      </dl>
      <p className="mt-3 text-sm font-medium text-bright-teal-blue-800">
        {tDocs("reviewExtractedItemsComingSoon")}
      </p>
    </div>
  );
}

type SummaryMetricProps = {
  label: string;
  value: string;
};

function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55">
        {label}
      </dt>
      <dd className="mt-1 wrap-break-word text-sm font-semibold text-deep-twilight-900">
        {value}
      </dd>
    </div>
  );
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFileSize(sizeBytes: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(sizeBytes / (1024 * 1024));
}

function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatConfidence(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "percent",
  }).format(value);
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
