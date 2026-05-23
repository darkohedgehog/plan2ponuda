"use client";

import {
  ArrowUpRight,
  Check,
  Clock3,
  Save,
  Upload,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import type {
  ImportProjectDocumentCandidatesResponse,
  ProjectDocumentCandidate,
  ProjectDocumentCandidateStatus,
  ProjectDocumentCandidateType,
  ProjectDocumentCandidatesResponse,
} from "@/types/project-document";

type ProjectDocumentCandidateReviewProps = {
  analysisId: string;
  documentId: string;
  projectId: string;
};

type DraftCandidate = Omit<
  ProjectDocumentCandidate,
  "quantity" | "totalPrice" | "unitPrice"
> & {
  quantity: string;
  unitPrice: string;
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

type ParsedDraftNumber =
  | {
      ok: true;
      value: number | null;
    }
  | {
      ok: false;
    };
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
const statusOptions: ProjectDocumentCandidateStatus[] = [
  "pending",
  "accepted",
  "rejected",
];

export function ProjectDocumentCandidateReview({
  analysisId,
  documentId,
  projectId,
}: ProjectDocumentCandidateReviewProps) {
  const locale = useLocale();
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const [candidates, setCandidates] = useState<DraftCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<CandidateReviewErrorKey | null>(
    null,
  );
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null,
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const candidateUrl = `/api/projects/${projectId}/documents/${documentId}/analysis/${analysisId}/candidates`;
  const importUrl = `/api/projects/${projectId}/documents/${documentId}/analysis/${analysisId}/import`;
  const quoteUrl = `/${locale}/dashboard/projects/${projectId}/quote`;

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
      setHasUnsavedChanges(false);
    }

    void loadInitialCandidates();

    return () => {
      isMounted = false;
    };
  }, [candidateUrl]);

  const materialCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.type === "material"),
    [candidates],
  );
  const laborCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.type === "labor"),
    [candidates],
  );
  const acceptedMaterialCandidates = useMemo(
    () =>
      materialCandidates.filter(
        (candidate) => candidate.status === "accepted",
      ),
    [materialCandidates],
  );
  const acceptedMaterialsReadyToImport = useMemo(
    () =>
      acceptedMaterialCandidates.filter(
        (candidate) => candidate.importedAt === null,
      ),
    [acceptedMaterialCandidates],
  );
  const acceptedLaborCandidates = useMemo(
    () =>
      laborCandidates.filter((candidate) => candidate.status === "accepted"),
    [laborCandidates],
  );
  const hasAcceptedMaterialsAlreadyImported =
    acceptedMaterialCandidates.length > 0 &&
    acceptedMaterialsReadyToImport.length === 0;

  function updateCandidate(id: string, updates: DraftCandidateUpdate) {
    setErrorKey(null);
    setImportSummary(null);
    setHasUnsavedChanges(true);
    setShowSaved(false);
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              ...updates,
            }
          : candidate,
      ),
    );
  }

  async function saveReview() {
    const payloadCandidates = [];

    for (const candidate of candidates) {
      const quantity = parseDraftNumber(candidate.quantity);
      const unitPrice = parseDraftNumber(candidate.unitPrice);

      if (
        candidate.name.trim().length === 0 ||
        candidate.unit.trim().length === 0 ||
        !quantity.ok ||
        !unitPrice.ok
      ) {
        setErrorKey("reviewFailed");
        setShowSaved(false);
        return;
      }

      payloadCandidates.push({
        category: candidate.category,
        description: candidate.description,
        id: candidate.id,
        name: candidate.name.trim(),
        notes: candidate.notes,
        quantity: quantity.value,
        status: candidate.status,
        unit: candidate.unit.trim(),
        unitPrice: unitPrice.value,
      });
    }

    setErrorKey(null);
    setImportSummary(null);
    setShowSaved(false);
    setIsSaving(true);

    const response = await fetch(candidateUrl, {
      body: JSON.stringify({
        candidates: payloadCandidates,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });
    const payload = (await response
      .json()
      .catch((): ProjectDocumentCandidatesResponse | null => null)) as
      | ProjectDocumentCandidatesResponse
      | null;

    setIsSaving(false);

    if (!response.ok || !payload || !payload.ok) {
      setErrorKey("reviewFailed");
      return;
    }

    setCandidates(payload.candidates.map(toDraftCandidate));
    setHasUnsavedChanges(false);
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
    setHasUnsavedChanges(false);
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
    <div className="mt-4 min-w-0 rounded-md border border-frosted-blue-200 bg-white p-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-deep-twilight-950">
            {tDocs("extractedCandidates")}
          </h4>
          <div className="mt-1 space-y-1 text-xs text-deep-twilight-700/70">
            <p>
              {acceptedMaterialsReadyToImport.length > 0
                ? tDocs("acceptedMaterialsReadyToImport", {
                    count: acceptedMaterialsReadyToImport.length,
                  })
                : hasAcceptedMaterialsAlreadyImported
                  ? tDocs("acceptedMaterialsAlreadyImported")
                  : tDocs("noAcceptedMaterialsToImport")}
            </p>
            {acceptedLaborCandidates.length > 0 ? (
              <p>
                {tDocs("acceptedLaborItemsNotImportedYet", {
                  count: acceptedLaborCandidates.length,
                })}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {showSaved ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {tDocs("reviewSaved")}
            </p>
          ) : null}
          {importSummary ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {tDocs("importCompleted")}
            </p>
          ) : null}
          <Button
            disabled={
              isLoading ||
              isSaving ||
              isImporting ||
              hasUnsavedChanges ||
              acceptedMaterialsReadyToImport.length === 0
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
          <Button
            disabled={isLoading || isSaving || isImporting}
            onClick={saveReview}
            type="button"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSaving ? tDocs("savingReview") : tDocs("saveReview")}
          </Button>
          {importSummary || hasAcceptedMaterialsAlreadyImported ? (
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 transition-colors hover:bg-frosted-blue-50"
              href={quoteUrl}
            >
              {tDocs("openQuote")}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>

      {errorKey ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {tDocs(errorKey)}
        </p>
      ) : null}

      {importSummary ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <p className="font-semibold">{tDocs("importCompleted")}</p>
          <p className="mt-1">
            {tDocs("importedMaterials", {
              count: importSummary.importedMaterialsCount,
            })}
            {" · "}
            {tDocs("skippedItems", {
              count: importSummary.skippedCount,
            })}
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <p className="mt-3 rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 py-2 text-sm text-deep-twilight-700">
          {tDocs("loadingCandidates")}
        </p>
      ) : candidates.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-frosted-blue-300 bg-frosted-blue-50 px-4 py-5 text-sm text-deep-twilight-700">
          {tDocs("noExtractedCandidates")}
        </p>
      ) : (
        <div className="mt-4 grid min-w-0 gap-4">
          <CandidateSection
            candidates={materialCandidates}
            locale={locale}
            onUpdate={updateCandidate}
            title={tDocs("materialCandidates")}
            type="material"
          />
          <CandidateSection
            candidates={laborCandidates}
            locale={locale}
            onUpdate={updateCandidate}
            title={tDocs("laborCandidates")}
            type="labor"
          />
        </div>
      )}
    </div>
  );
}

type CandidateSectionProps = {
  candidates: DraftCandidate[];
  locale: string;
  onUpdate: (id: string, updates: DraftCandidateUpdate) => void;
  title: string;
  type: ProjectDocumentCandidateType;
};

function CandidateSection({
  candidates,
  locale,
  onUpdate,
  title,
  type,
}: CandidateSectionProps) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");

  return (
    <details className="min-w-0 rounded-md border border-frosted-blue-200 bg-frosted-blue-50/70 p-3" open>
      <summary className="cursor-pointer text-sm font-semibold text-deep-twilight-950">
        {title}
      </summary>
      {candidates.length === 0 ? (
        <p className="mt-3 text-sm text-deep-twilight-700">
          {tDocs("noExtractedCandidates")}
        </p>
      ) : (
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
      )}
    </details>
  );
}

type CandidateEditorCardProps = {
  candidate: DraftCandidate;
  locale: string;
  onUpdate: (updates: DraftCandidateUpdate) => void;
  type: ProjectDocumentCandidateType;
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

  return (
    <article className="grid min-w-0 gap-3 rounded-md border border-frosted-blue-200 bg-white p-3 text-sm shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1.3fr)_minmax(8rem,0.7fr)_minmax(10rem,0.8fr)_minmax(8rem,0.65fr)_minmax(8rem,0.65fr)]">
      <div className="min-w-0 sm:col-span-2 xl:col-span-1">
        <FieldLabel label={tDocs("candidateStatus")} />
        <div className="mb-3 flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <StatusButton
              active={candidate.status === status}
              key={status}
              onClick={() => onUpdate({ status })}
              status={status}
            />
          ))}
        </div>
        <FieldLabel label={tDocs("candidateName")} />
        <TextInput
          ariaLabel={tDocs("candidateName")}
          onChange={(event) => onUpdate({ name: event.target.value })}
          value={candidate.name}
        />
      </div>

      {type === "material" ? (
        <div className="min-w-0">
          <FieldLabel label={tDocs("category")} />
          <SelectInput
            ariaLabel={tDocs("category")}
            onChange={(event) => onUpdate({ category: event.target.value })}
            options={materialCategoryOptions.map((category) => ({
              label: tCategories(category),
              value: category,
            }))}
            value={candidate.category ?? "other"}
          />
        </div>
      ) : (
        <div className="min-w-0 sm:col-span-2 xl:col-span-1">
          <FieldLabel label={tDocs("descriptionField")} />
          <TextArea
            ariaLabel={tDocs("descriptionField")}
            onChange={(event) => onUpdate({ description: event.target.value })}
            rows={3}
            value={candidate.description ?? ""}
          />
        </div>
      )}

      <div className="min-w-0">
        <FieldLabel label={tDocs("unit")} />
        <SelectInput
          ariaLabel={tDocs("unit")}
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
          onChange={(event) => onUpdate({ quantity: event.target.value })}
          value={candidate.quantity}
        />
      </div>

      <div className="min-w-0">
        <FieldLabel label={tDocs("unitPrice")} />
        <NumberInput
          ariaLabel={tDocs("unitPrice")}
          onChange={(event) => onUpdate({ unitPrice: event.target.value })}
          value={candidate.unitPrice}
        />
      </div>

      <div className="min-w-0 sm:col-span-2 xl:col-span-5">
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(8rem,0.45fr)]">
          <div className="min-w-0">
            <FieldLabel label={tDocs("notes")} />
            <TextArea
              ariaLabel={tDocs("notes")}
              onChange={(event) => onUpdate({ notes: event.target.value })}
              rows={2}
              value={candidate.notes ?? ""}
            />
          </div>
          <div className="min-w-0 space-y-2 text-sm text-deep-twilight-700">
            <CandidateMeta
              label={tDocs("sourceReference")}
              value={candidate.sourceReference ?? tDocs("notSet")}
            />
            <CandidateMeta
              label={tDocs("confidence")}
              value={formatConfidence(candidate.confidence, locale)}
            />
          </div>
          <div className="min-w-0">
            <FieldLabel label={tDocs("total")} />
            <p className="flex h-10 items-center justify-end rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 text-sm font-semibold tabular-nums text-deep-twilight-950">
              {total === null ? tDocs("notSet") : formatMoney(total, locale)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

type StatusButtonProps = {
  active: boolean;
  onClick: () => void;
  status: ProjectDocumentCandidateStatus;
};

function StatusButton({ active, onClick, status }: StatusButtonProps) {
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const Icon = status === "accepted" ? Check : status === "rejected" ? X : Clock3;

  return (
    <button
      className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
        active
          ? "border-bright-teal-blue-500 bg-bright-teal-blue-50 text-bright-teal-blue-800"
          : "border-frosted-blue-200 bg-white text-deep-twilight-700 hover:bg-frosted-blue-50"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {tDocs(`candidateStatuses.${status}`)}
    </button>
  );
}

type TextInputProps = {
  ariaLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

function TextInput({ ariaLabel, onChange, value }: TextInputProps) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-10 w-full min-w-0 rounded-md border border-frosted-blue-200 bg-white px-3 text-sm text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
      onChange={onChange}
      value={value}
    />
  );
}

type TextAreaProps = {
  ariaLabel: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  rows: number;
  value: string;
};

function TextArea({ ariaLabel, onChange, rows, value }: TextAreaProps) {
  return (
    <textarea
      aria-label={ariaLabel}
      className="w-full min-w-0 resize-y rounded-md border border-frosted-blue-200 bg-white px-3 py-2 text-sm text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
      onChange={onChange}
      rows={rows}
      value={value}
    />
  );
}

type NumberInputProps = {
  ariaLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

function NumberInput({ ariaLabel, onChange, value }: NumberInputProps) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-10 w-full min-w-0 rounded-md border border-frosted-blue-200 bg-white px-3 text-right text-sm tabular-nums text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
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
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{
    label: string;
    value: string;
  }>;
  value: string;
};

function SelectInput({ ariaLabel, onChange, options, value }: SelectInputProps) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-10 w-full min-w-0 rounded-md border border-frosted-blue-200 bg-white px-3 text-sm text-deep-twilight-950 outline-none focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
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
      <span className="mt-1 block wrap-break-word font-medium text-deep-twilight-900">
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

function parseDraftNumber(value: string): ParsedDraftNumber {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return {
      ok: true,
      value: null,
    };
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    value: parsedValue,
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
  type: ProjectDocumentCandidateType,
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
