"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Clock3,
  Filter,
  Lock,
  RotateCcw,
  Save,
  Upload,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildCandidateReviewSavePayload,
  filterCandidateReviewCandidates,
  getCandidateReviewCounters,
  getImportableAcceptedMaterialCount,
  getNextBulkCandidateStatusState,
  isImportedCandidate,
  parseDraftNumber,
  type CandidateReviewDraft,
  type CandidateReviewStatus,
  type CandidateReviewStatusFilter,
  type CandidateReviewType,
  type CandidateReviewTypeFilter,
} from "@/components/projects/project-document-candidate-review-state";
import type {
  ImportProjectDocumentCandidatesResponse,
  ProjectDocumentCandidate,
  ProjectDocumentCandidatesResponse,
} from "@/types/project-document";

type ProjectDocumentCandidateReviewProps = {
  analysisId: string;
  documentId: string;
  projectId: string;
};

type DraftCandidate = Omit<
  ProjectDocumentCandidate,
  "quantity" | "status" | "totalPrice" | "type" | "unitPrice"
> &
  CandidateReviewDraft & {
    totalPrice: string | null;
  };

type DraftCandidateUpdate = Partial<
  Pick<
    DraftCandidate,
    | "category"
    | "description"
    | "name"
    | "notes"
    | "quantity"
    | "status"
    | "unit"
    | "unitPrice"
  >
>;

type CandidateReviewErrorKey =
  | "importFailed"
  | "noAcceptedMaterialsToImport"
  | "quoteLimitReached"
  | "reviewFailed";
type ImportSummary = Extract<
  ImportProjectDocumentCandidatesResponse,
  { ok: true }
>;

const materialCategoryOptions = [
  "cable",
  "socket",
  "switch",
  "breaker",
  "box",
  "panel",
  "other",
] as const;

const materialUnitOptions = ["pcs", "m", "set"] as const;
const laborUnitOptions = ["hour", "item", "m2", "m", "set"] as const;
const statusOptions: CandidateReviewStatus[] = [
  "pending",
  "accepted",
  "rejected",
];
const typeFilterOptions: CandidateReviewTypeFilter[] = [
  "all",
  "material",
  "labor",
];
const statusFilterOptions: CandidateReviewStatusFilter[] = [
  "all",
  "pending",
  "accepted",
  "rejected",
  "imported",
];

export function ProjectDocumentCandidateReview({
  analysisId,
  documentId,
  projectId,
}: ProjectDocumentCandidateReviewProps) {
  const locale = useLocale();
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const [candidates, setCandidates] = useState<DraftCandidate[]>([]);
  const [dirtyCandidateIds, setDirtyCandidateIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [typeFilter, setTypeFilter] =
    useState<CandidateReviewTypeFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<CandidateReviewStatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<CandidateReviewErrorKey | null>(
    null,
  );
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null,
  );
  const [showSaved, setShowSaved] = useState(false);
  const candidateUrl = `/api/projects/${projectId}/documents/${documentId}/analysis/${analysisId}/candidates`;
  const importUrl = `/api/projects/${projectId}/documents/${documentId}/analysis/${analysisId}/import`;
  const quoteUrl = `/${locale}/dashboard/projects/${projectId}/quote`;
  const hasUnsavedChanges = dirtyCandidateIds.size > 0;

  useEffect(() => {
    let isMounted = true;

    async function loadInitialCandidates() {
      const response = await fetch(candidateUrl);
      const payload = (await response
        .json()
        .catch((): ProjectDocumentCandidatesResponse | null => null)) as
        | ProjectDocumentCandidatesResponse
        | null;

      if (!isMounted) {
        return;
      }

      setIsLoading(false);

      if (!response.ok || !payload || !payload.ok) {
        setErrorKey("reviewFailed");
        return;
      }

      setCandidates(payload.candidates.map(toDraftCandidate));
      setDirtyCandidateIds(new Set());
    }

    void loadInitialCandidates();

    return () => {
      isMounted = false;
    };
  }, [candidateUrl]);

  const counters = useMemo(
    () => getCandidateReviewCounters(candidates),
    [candidates],
  );
  const filteredCandidates = useMemo(
    () =>
      filterCandidateReviewCandidates(candidates, {
        status: statusFilter,
        type: typeFilter,
      }),
    [candidates, statusFilter, typeFilter],
  );
  const materialCandidates = useMemo(
    () =>
      filteredCandidates.filter((candidate) => candidate.type === "material"),
    [filteredCandidates],
  );
  const laborCandidates = useMemo(
    () => filteredCandidates.filter((candidate) => candidate.type === "labor"),
    [filteredCandidates],
  );
  const acceptedLaborCount = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          candidate.type === "labor" && candidate.status === "accepted",
      ).length,
    [candidates],
  );
  const acceptedMaterialsReadyToImport =
    getImportableAcceptedMaterialCount(candidates);
  const hasAcceptedMaterialsAlreadyImported =
    acceptedMaterialsReadyToImport === 0 &&
    candidates.some(
      (candidate) =>
        candidate.type === "material" &&
        candidate.status === "accepted" &&
        isImportedCandidate(candidate),
    );
  const hasImportedQuoteMaterials = candidates.some(
    (candidate) =>
      candidate.type === "material" &&
      candidate.importedProjectMaterialId !== null,
  );

  function updateCandidate(id: string, updates: DraftCandidateUpdate) {
    const candidate = candidates.find((current) => current.id === id);

    if (
      !candidate ||
      isImportedCandidate(candidate) ||
      !hasDraftCandidateUpdateChanged(candidate, updates)
    ) {
      return;
    }

    setErrorKey(null);
    setImportSummary(null);
    setShowSaved(false);
    setDirtyCandidateIds((currentIds) => addDirtyIds(currentIds, [id]));
    setCandidates((currentCandidates) =>
      currentCandidates.map((currentCandidate) =>
        currentCandidate.id === id
          ? {
              ...currentCandidate,
              ...updates,
            }
          : currentCandidate,
      ),
    );
  }

  function applyBulkStatus(
    type: CandidateReviewType,
    status: CandidateReviewStatus,
  ) {
    const result = getNextBulkCandidateStatusState(candidates, {
      status,
      type,
    });

    applyBulkResult(result);
  }

  function resetVisibleToPending() {
    const visibleIds = new Set(
      filteredCandidates.map((candidate) => candidate.id),
    );
    const result = getNextBulkCandidateStatusState(candidates, {
      ids: visibleIds,
      status: "pending",
    });

    applyBulkResult(result);
  }

  function applyBulkResult(result: {
    candidates: DraftCandidate[];
    changedIds: Set<string>;
  }) {
    if (result.changedIds.size === 0) {
      return;
    }

    setErrorKey(null);
    setImportSummary(null);
    setShowSaved(false);
    setCandidates(result.candidates);
    setDirtyCandidateIds((currentIds) =>
      addDirtyIds(currentIds, result.changedIds),
    );
  }

  async function saveReview() {
    const payload = buildCandidateReviewSavePayload(
      candidates,
      dirtyCandidateIds,
    );

    if (!payload.ok) {
      setErrorKey("reviewFailed");
      setShowSaved(false);
      return;
    }

    if (payload.candidates.length === 0) {
      setDirtyCandidateIds(new Set());
      setShowSaved(true);
      return;
    }

    setErrorKey(null);
    setImportSummary(null);
    setShowSaved(false);
    setIsSaving(true);

    const response = await fetch(candidateUrl, {
      body: JSON.stringify({
        candidates: payload.candidates,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });
    const responsePayload = (await response
      .json()
      .catch((): ProjectDocumentCandidatesResponse | null => null)) as
      | ProjectDocumentCandidatesResponse
      | null;

    setIsSaving(false);

    if (!response.ok || !responsePayload || !responsePayload.ok) {
      setErrorKey("reviewFailed");
      return;
    }

    setCandidates(responsePayload.candidates.map(toDraftCandidate));
    setDirtyCandidateIds(new Set());
    setShowSaved(true);
  }

  async function reloadCandidates() {
    const response = await fetch(candidateUrl);
    const payload = (await response
      .json()
      .catch((): ProjectDocumentCandidatesResponse | null => null)) as
      | ProjectDocumentCandidatesResponse
      | null;

    if (!response.ok || !payload || !payload.ok) {
      setErrorKey("reviewFailed");
      return;
    }

    setCandidates(payload.candidates.map(toDraftCandidate));
    setDirtyCandidateIds(new Set());
  }

  async function importAcceptedCandidates() {
    setErrorKey(null);
    setImportSummary(null);
    setShowSaved(false);
    setIsImporting(true);

    const response = await fetch(importUrl, {
      method: "POST",
    });
    const payload = (await response
      .json()
      .catch((): ImportProjectDocumentCandidatesResponse | null => null)) as
      | ImportProjectDocumentCandidatesResponse
      | null;

    setIsImporting(false);

    if (!response.ok || !payload || !payload.ok) {
      setErrorKey(getImportErrorKey(payload));
      return;
    }

    setImportSummary(payload);
    await reloadCandidates();
  }

  return (
    <div className="mt-4 min-w-0 overflow-hidden rounded-md border border-frosted-blue-200 bg-white p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-deep-twilight-950">
            {tDocs("extractedCandidates")}
          </h4>
          <div className="mt-1 space-y-1 text-xs leading-5 text-deep-twilight-700/75">
            <p>
              {acceptedMaterialsReadyToImport > 0
                ? tDocs("acceptedMaterialsReadyToImport", {
                    count: acceptedMaterialsReadyToImport,
                  })
                : hasAcceptedMaterialsAlreadyImported
                  ? tDocs("acceptedMaterialsAlreadyImported")
                  : tDocs("noAcceptedMaterialsToImport")}
            </p>
            {acceptedLaborCount > 0 ? (
              <p>
                {tDocs("acceptedLaborItemsNotImportedYet", {
                  count: acceptedLaborCount,
                })}
              </p>
            ) : null}
          </div>
        </div>
        {hasUnsavedChanges ? (
          <p className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 lg:w-auto">
            {tDocs("unsavedChanges", {
              count: dirtyCandidateIds.size,
            })}
          </p>
        ) : null}
      </div>

      <CandidateSummary counters={counters} />

      <div className="mt-4 grid min-w-0 gap-3 rounded-md border border-frosted-blue-200 bg-frosted-blue-50/60 p-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-deep-twilight-700/60">
          <Filter aria-hidden="true" className="h-4 w-4" />
          {tDocs("showFilters")}
        </div>
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,0.35fr)]">
          <div className="grid min-w-0 gap-2 sm:grid-cols-3">
            {typeFilterOptions.map((option) => (
              <button
                className={`h-auto min-h-10 min-w-0 rounded-md border px-3 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 ${
                  typeFilter === option
                    ? "border-bright-teal-blue-500 bg-white text-bright-teal-blue-800 shadow-sm"
                    : "border-frosted-blue-200 bg-white/70 text-deep-twilight-700 hover:bg-white"
                }`}
                key={option}
                onClick={() => setTypeFilter(option)}
                type="button"
              >
                {tDocs(`filters.type.${option}`)}
              </button>
            ))}
          </div>
          <select
            aria-label={tDocs("filters.statusLabel")}
            className="h-10 min-w-0 rounded-md border border-frosted-blue-200 bg-white px-3 text-sm font-semibold text-deep-twilight-800 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
            onChange={(event) =>
              setStatusFilter(event.target.value as CandidateReviewStatusFilter)
            }
            value={statusFilter}
          >
            {statusFilterOptions.map((option) => (
              <option key={option} value={option}>
                {tDocs(`filters.status.${option}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Button
            className="h-auto min-h-10 w-full whitespace-normal text-center"
            disabled={isLoading}
            onClick={() => applyBulkStatus("material", "accepted")}
            type="button"
            variant="secondary"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            {tDocs("bulk.acceptAllMaterials")}
          </Button>
          <Button
            className="h-auto min-h-10 w-full whitespace-normal text-center"
            disabled={isLoading}
            onClick={() => applyBulkStatus("material", "rejected")}
            type="button"
            variant="secondary"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            {tDocs("bulk.rejectAllMaterials")}
          </Button>
          <Button
            className="h-auto min-h-10 w-full whitespace-normal text-center"
            disabled={isLoading}
            onClick={() => applyBulkStatus("labor", "accepted")}
            type="button"
            variant="secondary"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            {tDocs("bulk.acceptAllLabor")}
          </Button>
          <Button
            className="h-auto min-h-10 w-full whitespace-normal text-center"
            disabled={isLoading}
            onClick={() => applyBulkStatus("labor", "rejected")}
            type="button"
            variant="secondary"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            {tDocs("bulk.rejectAllLabor")}
          </Button>
          <Button
            className="h-auto min-h-10 w-full whitespace-normal text-center"
            disabled={isLoading || filteredCandidates.length === 0}
            onClick={resetVisibleToPending}
            type="button"
            variant="secondary"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {tDocs("bulk.resetVisiblePending")}
          </Button>
        </div>
      </div>

      {errorKey ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {tDocs(errorKey)}
        </p>
      ) : null}

      {showSaved ? (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {tDocs("reviewSaved")}
        </p>
      ) : null}

      {importSummary ? (
        <ImportSummaryMessage importSummary={importSummary} />
      ) : null}

      {isLoading ? (
        <p className="mt-3 rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 py-2 text-sm text-deep-twilight-700">
          {tDocs("loadingCandidates")}
        </p>
      ) : candidates.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-frosted-blue-300 bg-frosted-blue-50 px-4 py-5 text-sm text-deep-twilight-700">
          {tDocs("noExtractedCandidates")}
        </p>
      ) : filteredCandidates.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-frosted-blue-300 bg-frosted-blue-50 px-4 py-5 text-sm text-deep-twilight-700">
          {tDocs("noCandidatesMatchFilter")}
        </p>
      ) : (
        <div className="mt-4 grid min-w-0 gap-4">
          {typeFilter !== "labor" && materialCandidates.length > 0 ? (
            <CandidateSection
              candidates={materialCandidates}
              locale={locale}
              onUpdate={updateCandidate}
              title={tDocs("materialCandidates")}
              type="material"
            />
          ) : null}
          {typeFilter !== "material" && laborCandidates.length > 0 ? (
            <CandidateSection
              candidates={laborCandidates}
              locale={locale}
              onUpdate={updateCandidate}
              title={tDocs("laborCandidates")}
              type="labor"
            />
          ) : null}
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-3 mt-4 border-t border-frosted-blue-200 bg-white/95 p-3 backdrop-blur sm:-mx-4 sm:p-4">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 text-sm text-deep-twilight-700">
            {hasUnsavedChanges ? (
              <span className="font-semibold text-amber-800">
                {tDocs("unsavedChanges", {
                  count: dirtyCandidateIds.size,
                })}
              </span>
            ) : (
              <span>{tDocs("allChangesSaved")}</span>
            )}
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:flex xl:items-center">
            <Button
              className="h-auto min-h-10 w-full whitespace-normal text-center"
              disabled={
                isLoading ||
                isSaving ||
                isImporting ||
                dirtyCandidateIds.size === 0
              }
              onClick={saveReview}
              type="button"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {isSaving ? tDocs("savingReview") : tDocs("saveVisibleChanges")}
            </Button>
            <Button
              className="h-auto min-h-10 w-full whitespace-normal text-center"
              disabled={
                isLoading ||
                isSaving ||
                isImporting ||
                hasUnsavedChanges ||
                acceptedMaterialsReadyToImport === 0
              }
              onClick={importAcceptedCandidates}
              type="button"
              variant="secondary"
            >
              <Upload aria-hidden="true" className="h-4 w-4" />
              {isImporting
                ? tDocs("importing")
                : tDocs("importAcceptedItemsToQuote")}
            </Button>
            {importSummary || hasAcceptedMaterialsAlreadyImported || hasImportedQuoteMaterials ? (
              <a
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-4 py-2 text-center text-sm font-semibold text-deep-twilight-800 outline-none transition-colors hover:bg-frosted-blue-50 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 sm:col-span-2 xl:col-span-auto"
                href={quoteUrl}
              >
                {tDocs("openQuote")}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type CandidateSectionProps = {
  candidates: DraftCandidate[];
  locale: string;
  onUpdate: (id: string, updates: DraftCandidateUpdate) => void;
  title: string;
  type: CandidateReviewType;
};

function CandidateSection({
  candidates,
  locale,
  onUpdate,
  title,
  type,
}: CandidateSectionProps) {
  return (
    <section className="min-w-0 rounded-md border border-frosted-blue-200 bg-frosted-blue-50/70 p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h5 className="wrap-break-word break-words text-sm font-semibold text-deep-twilight-950">
          {title}
        </h5>
        <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-deep-twilight-700 ring-1 ring-frosted-blue-200">
          {candidates.length}
        </span>
      </div>
      <div className="mt-3 grid min-w-0 gap-3">
        {candidates.map((candidate) => (
          <CandidateEditorCard
            candidate={candidate}
            key={candidate.id}
            locale={locale}
            onUpdate={(updates) => onUpdate(candidate.id, updates)}
            type={type}
          />
        ))}
      </div>
    </section>
  );
}

type CandidateEditorCardProps = {
  candidate: DraftCandidate;
  locale: string;
  onUpdate: (updates: DraftCandidateUpdate) => void;
  type: CandidateReviewType;
};

function CandidateEditorCard({
  candidate,
  locale,
  onUpdate,
  type,
}: CandidateEditorCardProps) {
  const tCategories = useTranslations("MaterialCategories");
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const total = calculateDraftTotal(candidate);
  const unitOptions = getUnitOptions(type, candidate.unit);
  const isImported = isImportedCandidate(candidate);
  const isImportedToQuote = candidate.importedProjectMaterialId !== null;
  const isLocked = isImported || isImportedToQuote;

  return (
    <article className="grid min-w-0 gap-3 rounded-md border border-frosted-blue-200 bg-white p-3 text-sm shadow-sm [contain-intrinsic-size:280px] [content-visibility:auto] xl:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]">
      <div className="min-w-0 xl:col-span-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CandidateTypeBadge type={type} />
          <CandidateStatusBadge status={candidate.status} />
          {isImported ? <ImportedStateBadge label={tDocs("imported")} /> : null}
          {isImportedToQuote ? (
            <ImportedStateBadge label={tDocs("importedToQuote")} />
          ) : null}
        </div>
        <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-2">
          <CandidateMeta
            label={tDocs("sourceReference")}
            value={candidate.sourceReference ?? tDocs("notSet")}
          />
          <CandidateMeta
            label={tDocs("confidence")}
            value={formatConfidence(candidate.confidence, locale)}
          />
        </div>
      </div>

      <div className="min-w-0">
        <FieldLabel label={tDocs("candidateStatus")} />
        <div className="mb-3 flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <StatusButton
              active={candidate.status === status}
              disabled={isLocked}
              key={status}
              onClick={() => onUpdate({ status })}
              status={status}
            />
          ))}
        </div>
        {isImportedToQuote ? (
          <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-800">
            <Lock aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />
            {tDocs("editImportedLineOnQuotePage")}{" "}
            {tDocs("changesAfterImportDoNotUpdateQuoteLinesYet")}
          </p>
        ) : null}
        <FieldLabel label={tDocs("candidateName")} />
        <TextInput
          ariaLabel={tDocs("candidateName")}
          disabled={isLocked}
          onChange={(event) => onUpdate({ name: event.target.value })}
          value={candidate.name}
        />
      </div>

      {type === "material" ? (
        <div className="min-w-0">
          <FieldLabel label={tDocs("category")} />
          <SelectInput
            ariaLabel={tDocs("category")}
            disabled={isLocked}
            onChange={(event) => onUpdate({ category: event.target.value })}
            options={materialCategoryOptions.map((category) => ({
              label: tCategories(category),
              value: category,
            }))}
            value={candidate.category ?? "other"}
          />
        </div>
      ) : (
        <div className="min-w-0">
          <FieldLabel label={tDocs("descriptionField")} />
          <TextArea
            ariaLabel={tDocs("descriptionField")}
            disabled={isLocked}
            onChange={(event) => onUpdate({ description: event.target.value })}
            rows={3}
            value={candidate.description ?? ""}
          />
        </div>
      )}

      <div className="grid min-w-0 gap-3 md:grid-cols-3 xl:grid-cols-1">
        <div className="min-w-0">
          <FieldLabel label={tDocs("unit")} />
          <SelectInput
            ariaLabel={tDocs("unit")}
            disabled={isLocked}
            onChange={(event) => onUpdate({ unit: event.target.value })}
            options={unitOptions.map((unit) => ({
              label: getUnitLabel(unit, tDocs),
              value: unit,
            }))}
            value={candidate.unit}
          />
        </div>
        <div className="min-w-0">
          <FieldLabel label={tDocs("quantity")} />
          <NumberInput
            ariaLabel={tDocs("quantity")}
            disabled={isLocked}
            onChange={(event) => onUpdate({ quantity: event.target.value })}
            value={candidate.quantity}
          />
        </div>
        <div className="min-w-0">
          <FieldLabel label={tDocs("unitPrice")} />
          <NumberInput
            ariaLabel={tDocs("unitPrice")}
            disabled={isLocked}
            onChange={(event) => onUpdate({ unitPrice: event.target.value })}
            value={candidate.unitPrice}
          />
        </div>
      </div>

      <div className="min-w-0 xl:col-span-3">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(8rem,0.35fr)]">
          <div className="min-w-0">
            <FieldLabel label={tDocs("notes")} />
            <TextArea
              ariaLabel={tDocs("notes")}
              disabled={isLocked}
              onChange={(event) => onUpdate({ notes: event.target.value })}
              rows={2}
              value={candidate.notes ?? ""}
            />
          </div>
          <div className="min-w-0">
            <FieldLabel label={tDocs("total")} />
            <p className="flex min-h-10 min-w-0 items-center rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 text-sm font-semibold tabular-nums text-deep-twilight-950 sm:justify-end">
              {total === null ? tDocs("notSet") : formatMoney(total, locale)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function CandidateSummary({
  counters,
}: {
  counters: ReturnType<typeof getCandidateReviewCounters>;
}) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const items = [
    ["totalCandidates", counters.total],
    ["materialCandidates", counters.material],
    ["laborCandidates", counters.labor],
    ["accepted", counters.accepted],
    ["rejected", counters.rejected],
    ["pending", counters.pending],
    ["imported", counters.imported],
  ] as const;

  return (
    <dl className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {items.map(([labelKey, value]) => (
        <div
          className="min-w-0 rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 py-2"
          key={labelKey}
        >
          <dt className="truncate text-xs font-semibold uppercase tracking-wide text-deep-twilight-700/55">
            {tDocs(labelKey)}
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-deep-twilight-950">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ImportSummaryMessage({
  importSummary,
}: {
  importSummary: ImportSummary;
}) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");

  return (
    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      <p className="font-semibold">{tDocs("importCompleted")}</p>
      <p className="mt-1">
        {tDocs("importedMaterials", {
          count: importSummary.importedMaterialsCount,
        })}
        {importSummary.laborSkippedCount > 0 ? (
          <>
            {" · "}
            {tDocs("skippedLaborItems", {
              count: importSummary.laborSkippedCount,
            })}
          </>
        ) : null}
        {importSummary.alreadyImportedCount > 0 ? (
          <>
            {" · "}
            {tDocs("alreadyImportedItems", {
              count: importSummary.alreadyImportedCount,
            })}
          </>
        ) : null}
      </p>
    </div>
  );
}

type StatusButtonProps = {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  status: CandidateReviewStatus;
};

function StatusButton({
  active,
  disabled = false,
  onClick,
  status,
}: StatusButtonProps) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const Icon = status === "accepted" ? Check : status === "rejected" ? X : Clock3;

  return (
    <button
      className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "border-bright-teal-blue-500 bg-bright-teal-blue-50 text-bright-teal-blue-800"
          : "border-frosted-blue-200 bg-white text-deep-twilight-700 hover:bg-frosted-blue-50"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {tDocs(`candidateStatuses.${status}`)}
    </button>
  );
}

function CandidateTypeBadge({ type }: { type: CandidateReviewType }) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");

  return (
    <span className="inline-flex h-8 items-center rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-2.5 text-xs font-semibold text-deep-twilight-700">
      {tDocs(`typeLabels.${type}`)}
    </span>
  );
}

function CandidateStatusBadge({ status }: { status: CandidateReviewStatus }) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");

  return (
    <span className="inline-flex h-8 items-center rounded-md border border-bright-teal-blue-200 bg-bright-teal-blue-50 px-2.5 text-xs font-semibold text-bright-teal-blue-800">
      {tDocs(`statusLabels.${status}`)}
    </span>
  );
}

function ImportedStateBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700">
      <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

type TextInputProps = {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

function TextInput({
  ariaLabel,
  disabled = false,
  onChange,
  value,
}: TextInputProps) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-10 w-full min-w-0 rounded-md border border-frosted-blue-200 bg-white px-3 text-sm text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100 disabled:bg-frosted-blue-50 disabled:text-deep-twilight-700/60"
      disabled={disabled}
      onChange={onChange}
      value={value}
    />
  );
}

type TextAreaProps = {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  rows: number;
  value: string;
};

function TextArea({
  ariaLabel,
  disabled = false,
  onChange,
  rows,
  value,
}: TextAreaProps) {
  return (
    <textarea
      aria-label={ariaLabel}
      className="w-full min-w-0 resize-y rounded-md border border-frosted-blue-200 bg-white px-3 py-2 text-sm text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100 disabled:bg-frosted-blue-50 disabled:text-deep-twilight-700/60"
      disabled={disabled}
      onChange={onChange}
      rows={rows}
      value={value}
    />
  );
}

type NumberInputProps = {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

function NumberInput({
  ariaLabel,
  disabled = false,
  onChange,
  value,
}: NumberInputProps) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-10 w-full min-w-0 rounded-md border border-frosted-blue-200 bg-white px-3 text-right text-sm tabular-nums text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100 disabled:bg-frosted-blue-50 disabled:text-deep-twilight-700/60"
      disabled={disabled}
      min="0"
      onChange={onChange}
      step="0.01"
      type="number"
      value={value}
    />
  );
}

type SelectInputProps = {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{
    label: string;
    value: string;
  }>;
  value: string;
};

function SelectInput({
  ariaLabel,
  disabled = false,
  onChange,
  options,
  value,
}: SelectInputProps) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-10 w-full min-w-0 rounded-md border border-frosted-blue-200 bg-white px-3 text-sm text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100 disabled:bg-frosted-blue-50 disabled:text-deep-twilight-700/60"
      disabled={disabled}
      onChange={onChange}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-deep-twilight-700/55">
      {label}
    </span>
  );
}

function CandidateMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 py-2">
      <span className="block text-xs font-semibold uppercase tracking-wide text-deep-twilight-700/55">
        {label}
      </span>
      <span className="mt-1 block wrap-break-word break-words font-medium text-deep-twilight-900">
        {value}
      </span>
    </div>
  );
}

function toDraftCandidate(candidate: ProjectDocumentCandidate): DraftCandidate {
  return {
    ...candidate,
    category:
      candidate.category ??
      (candidate.type === "material" ? "other" : "labor"),
    quantity: candidate.quantity ?? "",
    unitPrice: candidate.unitPrice ?? "",
  };
}

function calculateDraftTotal(candidate: DraftCandidate): number | null {
  const quantity = parseDraftNumber(candidate.quantity);
  const unitPrice = parseDraftNumber(candidate.unitPrice);

  if (
    !quantity.ok ||
    !unitPrice.ok ||
    quantity.value === null ||
    unitPrice.value === null
  ) {
    return null;
  }

  return quantity.value * unitPrice.value;
}

function getUnitOptions(
  type: CandidateReviewType,
  currentUnit: string,
): string[] {
  const baseOptions =
    type === "material" ? [...materialUnitOptions] : [...laborUnitOptions];

  if (baseOptions.some((option) => option === currentUnit)) {
    return baseOptions;
  }

  return [currentUnit, ...baseOptions];
}

function getUnitLabel(
  unit: string,
  tDocs: ReturnType<typeof useTranslations>,
): string {
  switch (unit) {
    case "hour":
      return tDocs("units.hour");
    case "item":
      return tDocs("units.item");
    case "m":
      return tDocs("units.m");
    case "m2":
      return tDocs("units.m2");
    case "pcs":
      return tDocs("units.pcs");
    case "set":
      return tDocs("units.set");
    default:
      return unit;
  }
}

function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function formatConfidence(value: string | null, locale: string): string {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "percent",
  }).format(Number(value));
}

function getImportErrorKey(
  payload: ImportProjectDocumentCandidatesResponse | null,
): CandidateReviewErrorKey {
  if (!payload || payload.ok) {
    return "importFailed";
  }

  switch (payload.error.code) {
    case "no_accepted_materials":
      return "noAcceptedMaterialsToImport";
    case "quote_limit_reached":
      return "quoteLimitReached";
    default:
      return "importFailed";
  }
}

function addDirtyIds(
  currentIds: Set<string>,
  nextIds: Iterable<string>,
): Set<string> {
  const updatedIds = new Set(currentIds);

  for (const id of nextIds) {
    updatedIds.add(id);
  }

  return updatedIds;
}

function hasDraftCandidateUpdateChanged(
  candidate: DraftCandidate,
  updates: DraftCandidateUpdate,
): boolean {
  const updateKeys = Object.keys(updates) as Array<keyof DraftCandidateUpdate>;

  return updateKeys.some((key) => candidate[key] !== updates[key]);
}
