export type CandidateReviewType = "labor" | "material";
export type CandidateReviewStatus = "accepted" | "pending" | "rejected";
export type CandidateReviewTypeFilter = "all" | CandidateReviewType;
export type CandidateReviewStatusFilter = "all" | CandidateReviewStatus | "imported";

export type CandidateReviewDraft = {
  category: string | null;
  description: string | null;
  id: string;
  importedAt: Date | string | null;
  importedProjectMaterialId: string | null;
  name: string;
  notes: string | null;
  quantity: string;
  status: CandidateReviewStatus;
  type: CandidateReviewType;
  unit: string;
  unitPrice: string;
};

export type CandidateReviewCounters = {
  accepted: number;
  imported: number;
  importableMaterials: number;
  labor: number;
  material: number;
  pending: number;
  rejected: number;
  total: number;
};

export type CandidateReviewFilters = {
  status: CandidateReviewStatusFilter;
  type: CandidateReviewTypeFilter;
};

export type CandidateReviewSavePayloadCandidate = {
  category?: string | null;
  description?: string | null;
  id: string;
  name: string;
  notes?: string | null;
  quantity?: number | null;
  status: CandidateReviewStatus;
  unit: string;
  unitPrice?: number | null;
};

export type BuildCandidateReviewSavePayloadResult =
  | {
      candidates: CandidateReviewSavePayloadCandidate[];
      ok: true;
    }
  | {
      ok: false;
    };

type ParsedDraftNumber =
  | {
      ok: true;
      value: number | null;
    }
  | {
      ok: false;
    };

export function getCandidateReviewCounters(
  candidates: CandidateReviewDraft[],
): CandidateReviewCounters {
  return candidates.reduce<CandidateReviewCounters>(
    (counters, candidate) => {
      counters.total += 1;
      counters[candidate.type] += 1;
      counters[candidate.status] += 1;

      if (isImportedCandidate(candidate)) {
        counters.imported += 1;
      }

      if (isImportableAcceptedMaterialCandidate(candidate)) {
        counters.importableMaterials += 1;
      }

      return counters;
    },
    {
      accepted: 0,
      imported: 0,
      importableMaterials: 0,
      labor: 0,
      material: 0,
      pending: 0,
      rejected: 0,
      total: 0,
    },
  );
}

export function filterCandidateReviewCandidates<Candidate extends CandidateReviewDraft>(
  candidates: Candidate[],
  filters: CandidateReviewFilters,
): Candidate[] {
  return candidates.filter((candidate) => {
    const typeMatches = filters.type === "all" || candidate.type === filters.type;
    const statusMatches =
      filters.status === "all"
        ? true
        : filters.status === "imported"
          ? isImportedCandidate(candidate)
          : candidate.status === filters.status;

    return typeMatches && statusMatches;
  });
}

export function getImportableAcceptedMaterialCount(
  candidates: CandidateReviewDraft[],
): number {
  return candidates.filter(isImportableAcceptedMaterialCandidate).length;
}

export function getNextBulkCandidateStatusState<
  Candidate extends CandidateReviewDraft,
>(
  candidates: Candidate[],
  params: {
    ids?: Set<string>;
    status: CandidateReviewStatus;
    type?: CandidateReviewType;
  },
): {
  candidates: Candidate[];
  changedIds: Set<string>;
} {
  const changedIds = new Set<string>();
  const nextCandidates = candidates.map((candidate) => {
    const typeMatches = !params.type || candidate.type === params.type;
    const idMatches = !params.ids || params.ids.has(candidate.id);

    if (
      !typeMatches ||
      !idMatches ||
      isImportedCandidate(candidate) ||
      candidate.status === params.status
    ) {
      return candidate;
    }

    changedIds.add(candidate.id);

    return {
      ...candidate,
      status: params.status,
    };
  });

  return {
    candidates: nextCandidates,
    changedIds,
  };
}

export function buildCandidateReviewSavePayload(
  candidates: CandidateReviewDraft[],
  dirtyCandidateIds: Set<string>,
): BuildCandidateReviewSavePayloadResult {
  const payloadCandidates: CandidateReviewSavePayloadCandidate[] = [];

  for (const candidate of candidates) {
    if (!dirtyCandidateIds.has(candidate.id) || isImportedCandidate(candidate)) {
      continue;
    }

    const quantity = parseDraftNumber(candidate.quantity);
    const unitPrice = parseDraftNumber(candidate.unitPrice);
    const name = candidate.name.trim();
    const unit = candidate.unit.trim();

    if (
      name.length === 0 ||
      unit.length === 0 ||
      !quantity.ok ||
      !unitPrice.ok
    ) {
      return {
        ok: false,
      };
    }

    payloadCandidates.push({
      category: candidate.category,
      description: normalizeNullableText(candidate.description),
      id: candidate.id,
      name,
      notes: normalizeNullableText(candidate.notes),
      quantity: quantity.value,
      status: candidate.status,
      unit,
      unitPrice: unitPrice.value,
    });
  }

  return {
    candidates: payloadCandidates,
    ok: true,
  };
}

export function isImportedCandidate(candidate: CandidateReviewDraft): boolean {
  return (
    candidate.importedAt !== null || candidate.importedProjectMaterialId !== null
  );
}

export function parseDraftNumber(value: string): ParsedDraftNumber {
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

function isImportableAcceptedMaterialCandidate(
  candidate: CandidateReviewDraft,
): boolean {
  return (
    candidate.type === "material" &&
    candidate.status === "accepted" &&
    !isImportedCandidate(candidate)
  );
}

function normalizeNullableText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length === 0 ? null : trimmedValue;
}
