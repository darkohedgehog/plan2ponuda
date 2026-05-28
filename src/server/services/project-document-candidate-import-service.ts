import "server-only";

import type { ProjectDocumentCandidate as DbProjectDocumentCandidate } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  buildImportedProjectMaterialCreateInput,
} from "@/server/services/project-document-candidate-builders";
import { ensureCandidatesForAnalysis } from "@/server/services/project-document-candidate-service";
import {
  findAndLockProjectForQuote,
  recalculateQuoteFromPersistedMaterials,
} from "@/server/services/quote-service";
import {
  getEffectivePlan,
  UsageLimitExceededError,
} from "@/server/services/billing-service";
import { getUserLaborFactor } from "@/server/services/settings-service";

type ProjectDocumentCandidateImportClient = Pick<
  typeof prisma,
  | "$queryRaw"
  | "project"
  | "projectDocumentAnalysis"
  | "projectDocumentCandidate"
  | "projectMaterial"
  | "quote"
  | "subscription"
  | "usageCounter"
  | "userSettings"
>;

type OwnedAnalysisForImport = {
  document: {
    project: {
      id: string;
    };
  };
  id: string;
};

type AcceptedCandidateImportSummary = {
  alreadyImportedCount: number;
  laborSkippedCount: number;
  materialCandidatesToImport: DbProjectDocumentCandidate[];
  skippedCount: number;
};

type ImportAcceptedDocumentCandidatesToQuoteTransactionInput = {
  alreadyImportedCount: number;
  analysisId: string;
  laborSkippedCount: number;
  materialCandidatesToImport: DbProjectDocumentCandidate[];
  projectId: string;
  userId: string;
};

type ImportAcceptedDocumentCandidatesToQuoteTransactionResult =
  | {
      result: Extract<ImportAcceptedDocumentCandidatesToQuoteResult, { ok: true }>;
      status: "imported";
    }
  | {
      status: "no_materials_imported";
    }
  | {
      status: "not_found";
    };

const PROJECT_DOCUMENT_IMPORT_TRANSACTION_TIMEOUT_MS = 15_000;

export type ImportAcceptedDocumentCandidatesToQuoteResult =
  | {
      importedLaborCount: number;
      importedMaterialsCount: number;
      alreadyImportedCount: number;
      laborSkippedCount: number;
      ok: true;
      quoteId: string;
      skippedCount: number;
    }
  | {
      ok: false;
      reason:
        | "no_accepted_materials"
        | "not_found"
        | "pro_plan_required"
        | "quote_limit_reached";
    };

export async function importAcceptedDocumentCandidatesToQuote(
  projectId: string,
  documentId: string,
  analysisId: string,
  userId: string,
): Promise<ImportAcceptedDocumentCandidatesToQuoteResult> {
  const plan = await getEffectivePlan(userId);

  if (plan !== "pro") {
    return {
      ok: false,
      reason: "pro_plan_required",
    };
  }

  const analysis = await findOwnedCompletedAnalysisForImport(
    projectId,
    documentId,
    analysisId,
    userId,
  );

  if (!analysis) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  await ensureCandidatesForAnalysis(analysis.id);

  const acceptedCandidates = await getAcceptedCandidatesForImport(analysis.id);
  const acceptedCandidateSummary =
    getAcceptedCandidateImportSummary(acceptedCandidates);

  if (acceptedCandidateSummary.materialCandidatesToImport.length === 0) {
    return getNoImportableMaterialsResult(
      analysis.document.project.id,
      acceptedCandidates,
      acceptedCandidateSummary.skippedCount,
      prisma,
    );
  }

  try {
    const transactionResult = await prisma.$transaction(
      (transaction) =>
        importAcceptedDocumentCandidatesToQuoteInTransaction(
          {
            alreadyImportedCount:
              acceptedCandidateSummary.alreadyImportedCount,
            analysisId: analysis.id,
            laborSkippedCount: acceptedCandidateSummary.laborSkippedCount,
            materialCandidatesToImport:
              acceptedCandidateSummary.materialCandidatesToImport,
            projectId: analysis.document.project.id,
            userId,
          },
          transaction,
        ),
      {
        timeout: PROJECT_DOCUMENT_IMPORT_TRANSACTION_TIMEOUT_MS,
      },
    );

    if (transactionResult.status === "imported") {
      return transactionResult.result;
    }

    if (transactionResult.status === "not_found") {
      return {
        ok: false,
        reason: "not_found",
      };
    }

    const refreshedAcceptedCandidates = await getAcceptedCandidatesForImport(
      analysis.id,
    );
    const refreshedSummary = getAcceptedCandidateImportSummary(
      refreshedAcceptedCandidates,
    );

    return getNoImportableMaterialsResult(
      analysis.document.project.id,
      refreshedAcceptedCandidates,
      refreshedSummary.skippedCount,
      prisma,
    );
  } catch (error: unknown) {
    if (
      error instanceof UsageLimitExceededError &&
      error.type === "quotes_created"
    ) {
      return {
        ok: false,
        reason: "quote_limit_reached",
      };
    }

    throw error;
  }
}

async function importAcceptedDocumentCandidatesToQuoteInTransaction(
  input: ImportAcceptedDocumentCandidatesToQuoteTransactionInput,
  db: ProjectDocumentCandidateImportClient,
): Promise<ImportAcceptedDocumentCandidatesToQuoteTransactionResult> {
  const {
    alreadyImportedCount,
    analysisId,
    laborSkippedCount,
    materialCandidatesToImport,
    projectId,
    userId,
  } = input;

  const lockedProject = await findAndLockProjectForQuote(
    db,
    projectId,
    userId,
  );

  if (!lockedProject) {
    return {
      status: "not_found",
    };
  }

  let importedMaterialsCount = 0;
  let concurrentlySkippedCount = 0;

  for (const candidate of materialCandidatesToImport) {
    const importedAt = new Date();
    const markedCandidate = await db.projectDocumentCandidate.updateMany({
      data: {
        importedAt,
      },
      where: {
        id: candidate.id,
        importedAt: null,
        importedProjectMaterialId: null,
        projectDocumentAnalysisId: analysisId,
        status: "accepted",
        type: "material",
      },
    });

    if (markedCandidate.count !== 1) {
      concurrentlySkippedCount += 1;
      continue;
    }

    const projectMaterial = await db.projectMaterial.create({
      data: buildImportedProjectMaterialCreateInput(lockedProject.id, candidate),
    });

    await db.projectDocumentCandidate.update({
      data: {
        importedProjectMaterialId: projectMaterial.id,
      },
      where: {
        id: candidate.id,
      },
    });
    importedMaterialsCount += 1;
  }

  if (importedMaterialsCount === 0) {
    return {
      status: "no_materials_imported",
    };
  }

  const laborFactor = await getUserLaborFactor(userId, db);
  const quote = await recalculateQuoteFromPersistedMaterials(
    lockedProject.id,
    lockedProject.areaM2,
    laborFactor,
    db,
    {
      consumeFirstQuoteForUserId: userId,
    },
  );

  return {
    result: {
      importedLaborCount: 0,
      importedMaterialsCount,
      alreadyImportedCount,
      laborSkippedCount,
      ok: true,
      quoteId: quote.id,
      skippedCount:
        alreadyImportedCount + laborSkippedCount + concurrentlySkippedCount,
    },
    status: "imported",
  };
}

async function getNoImportableMaterialsResult(
  projectId: string,
  acceptedCandidates: DbProjectDocumentCandidate[],
  skippedCount: number,
  db: ProjectDocumentCandidateImportClient,
): Promise<ImportAcceptedDocumentCandidatesToQuoteResult> {
  const laborSkippedCount = acceptedCandidates.filter(
    (candidate) => candidate.type === "labor" && candidate.importedAt === null,
  ).length;
  const hasAcceptedImportedMaterial = acceptedCandidates.some(
    (candidate) =>
      candidate.type === "material" && isAcceptedImportedCandidate(candidate),
  );

  if (hasAcceptedImportedMaterial) {
    const quote = await db.quote.findUnique({
      select: {
        id: true,
      },
      where: {
        projectId,
      },
    });

    if (quote) {
      return {
        importedLaborCount: 0,
        importedMaterialsCount: 0,
        alreadyImportedCount: Math.max(0, skippedCount - laborSkippedCount),
        laborSkippedCount,
        ok: true,
        quoteId: quote.id,
        skippedCount,
      };
    }
  }

  return {
    ok: false,
    reason: "no_accepted_materials",
  };
}

async function findOwnedCompletedAnalysisForImport(
  projectId: string,
  documentId: string,
  analysisId: string,
  userId: string,
  db: ProjectDocumentCandidateImportClient = prisma,
): Promise<OwnedAnalysisForImport | null> {
  return db.projectDocumentAnalysis.findFirst({
    select: {
      document: {
        select: {
          project: {
            select: {
              id: true,
            },
          },
        },
      },
      id: true,
    },
    where: {
      id: analysisId,
      projectDocumentId: documentId,
      status: "completed",
      document: {
        projectId,
        project: {
          userId,
        },
      },
    },
  });
}

async function getAcceptedCandidatesForImport(
  analysisId: string,
  db: ProjectDocumentCandidateImportClient = prisma,
): Promise<DbProjectDocumentCandidate[]> {
  return db.projectDocumentCandidate.findMany({
    orderBy: [
      {
        type: "desc",
      },
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
    where: {
      projectDocumentAnalysisId: analysisId,
      status: "accepted",
    },
  });
}

function getAcceptedCandidateImportSummary(
  acceptedCandidates: DbProjectDocumentCandidate[],
): AcceptedCandidateImportSummary {
  const materialCandidatesToImport = acceptedCandidates.filter(
    isImportableAcceptedMaterialCandidate,
  );
  const laborSkippedCount = acceptedCandidates.filter(
    (candidate) => candidate.type === "labor" && candidate.importedAt === null,
  ).length;
  const alreadyImportedCount = acceptedCandidates.filter(
    isAcceptedImportedCandidate,
  ).length;

  return {
    alreadyImportedCount,
    laborSkippedCount,
    materialCandidatesToImport,
    skippedCount: alreadyImportedCount + laborSkippedCount,
  };
}

function isImportableAcceptedMaterialCandidate(
  candidate: DbProjectDocumentCandidate,
): boolean {
  return (
    candidate.type === "material" &&
    candidate.importedAt === null &&
    candidate.importedProjectMaterialId === null
  );
}

function isAcceptedImportedCandidate(
  candidate: DbProjectDocumentCandidate,
): boolean {
  return (
    candidate.importedAt !== null || candidate.importedProjectMaterialId !== null
  );
}
