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

export type ImportAcceptedDocumentCandidatesToQuoteResult =
  | {
      importedLaborCount: number;
      importedMaterialsCount: number;
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

  return prisma
    .$transaction(async (transaction) =>
      importAcceptedDocumentCandidatesToQuoteInTransaction(
        projectId,
        documentId,
        analysisId,
        userId,
        transaction,
      ),
    )
    .catch((error: unknown) => {
      if (
        error instanceof UsageLimitExceededError &&
        error.type === "quotes_created"
      ) {
        return {
          ok: false as const,
          reason: "quote_limit_reached" as const,
        };
      }

      throw error;
    });
}

async function importAcceptedDocumentCandidatesToQuoteInTransaction(
  projectId: string,
  documentId: string,
  analysisId: string,
  userId: string,
  db: ProjectDocumentCandidateImportClient,
): Promise<ImportAcceptedDocumentCandidatesToQuoteResult> {
  const analysis = await findOwnedCompletedAnalysisForImport(
    projectId,
    documentId,
    analysisId,
    userId,
    db,
  );

  if (!analysis) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  await ensureCandidatesForAnalysis(analysis.id, db);

  const acceptedCandidates = await db.projectDocumentCandidate.findMany({
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
      projectDocumentAnalysisId: analysis.id,
      status: "accepted",
    },
  });
  const materialCandidatesToImport = acceptedCandidates.filter(
    (candidate) =>
      candidate.type === "material" && candidate.importedAt === null,
  );
  const laborSkippedCount = acceptedCandidates.filter(
    (candidate) => candidate.type === "labor" && candidate.importedAt === null,
  ).length;
  const alreadyImportedCount = acceptedCandidates.filter(
    (candidate) => candidate.importedAt !== null,
  ).length;

  if (materialCandidatesToImport.length === 0) {
    return getNoImportableMaterialsResult(
      analysis.document.project.id,
      acceptedCandidates,
      alreadyImportedCount + laborSkippedCount,
      db,
    );
  }

  const lockedProject = await findAndLockProjectForQuote(
    db,
    analysis.document.project.id,
    userId,
  );

  if (!lockedProject) {
    return {
      ok: false,
      reason: "not_found",
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
        projectDocumentAnalysisId: analysis.id,
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
    return getNoImportableMaterialsResult(
      lockedProject.id,
      acceptedCandidates,
      alreadyImportedCount + laborSkippedCount + concurrentlySkippedCount,
      db,
    );
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
    importedLaborCount: 0,
    importedMaterialsCount,
    laborSkippedCount,
    ok: true,
    quoteId: quote.id,
    skippedCount:
      alreadyImportedCount + laborSkippedCount + concurrentlySkippedCount,
  };
}

async function getNoImportableMaterialsResult(
  projectId: string,
  acceptedCandidates: DbProjectDocumentCandidate[],
  skippedCount: number,
  db: ProjectDocumentCandidateImportClient,
): Promise<ImportAcceptedDocumentCandidatesToQuoteResult> {
  const hasAcceptedImportedMaterial = acceptedCandidates.some(
    (candidate) => candidate.type === "material" && candidate.importedAt !== null,
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
        laborSkippedCount: acceptedCandidates.filter(
          (candidate) =>
            candidate.type === "labor" && candidate.importedAt === null,
        ).length,
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
  db: ProjectDocumentCandidateImportClient,
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
