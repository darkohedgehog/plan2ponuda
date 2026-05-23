import "server-only";

import type {
  ProjectDocumentCandidate as DbProjectDocumentCandidate,
  ProjectDocumentCandidateType,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  buildProjectDocumentCandidateCreateInputs,
  calculateCandidateTotalPrice,
} from "@/server/services/project-document-candidate-builders";
import {
  projectDocumentAnalysisOutputSchema,
  projectDocumentLaborUnitSchema,
  projectDocumentMaterialCategorySchema,
  projectDocumentMaterialUnitSchema,
} from "@/lib/validations/project-document-analysis.schema";
import type { SaveProjectDocumentCandidateReviewInput } from "@/lib/validations/project-document-candidate.schema";
import type { ProjectDocumentCandidate } from "@/types/project-document";

type ProjectDocumentCandidateClient = Pick<
  typeof prisma,
  "projectDocumentAnalysis" | "projectDocumentCandidate"
>;

type CandidateReviewResult =
  | {
      candidates: ProjectDocumentCandidate[];
      ok: true;
    }
  | {
      ok: false;
      reason:
        | "invalid_candidate_input"
        | "invalid_candidate_reference"
        | "not_found";
    };

const materialCategoryValues = new Set<string>(
  projectDocumentMaterialCategorySchema.options,
);
const materialUnitValues = new Set<string>(
  projectDocumentMaterialUnitSchema.options,
);
const laborUnitValues = new Set<string>(projectDocumentLaborUnitSchema.options);

export async function ensureCandidatesForAnalysis(
  analysisId: string,
  db: ProjectDocumentCandidateClient = prisma,
): Promise<ProjectDocumentCandidate[]> {
  const existingCount = await db.projectDocumentCandidate.count({
    where: {
      projectDocumentAnalysisId: analysisId,
    },
  });

  if (existingCount === 0) {
    const analysis = await db.projectDocumentAnalysis.findUnique({
      select: {
        parsedResponseJson: true,
        status: true,
      },
      where: {
        id: analysisId,
      },
    });

    if (analysis?.status === "completed") {
      const parsedResponse = projectDocumentAnalysisOutputSchema.safeParse(
        analysis.parsedResponseJson,
      );

      if (parsedResponse.success) {
        const candidates = buildProjectDocumentCandidateCreateInputs(
          analysisId,
          parsedResponse.data,
        );

        if (candidates.length > 0) {
          await db.projectDocumentCandidate.createMany({
            data: candidates,
            skipDuplicates: true,
          });
        }
      }
    }
  }

  return getCandidatesForAnalysis(analysisId, db);
}

export async function getDocumentCandidates(
  projectId: string,
  documentId: string,
  analysisId: string,
  userId: string,
): Promise<CandidateReviewResult> {
  const analysis = await findOwnedCompletedAnalysis(
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

  return {
    candidates: await ensureCandidatesForAnalysis(analysis.id),
    ok: true,
  };
}

export async function saveDocumentCandidateReview(
  projectId: string,
  documentId: string,
  analysisId: string,
  userId: string,
  input: SaveProjectDocumentCandidateReviewInput,
): Promise<CandidateReviewResult> {
  return prisma.$transaction(async (transaction): Promise<CandidateReviewResult> => {
    const analysis = await findOwnedCompletedAnalysis(
      projectId,
      documentId,
      analysisId,
      userId,
      transaction,
    );

    if (!analysis) {
      return {
        ok: false,
        reason: "not_found",
      };
    }

    await ensureCandidatesForAnalysis(analysis.id, transaction);

    const candidateIds = input.candidates.map((candidate) => candidate.id);

    if (new Set(candidateIds).size !== candidateIds.length) {
      return {
        ok: false,
        reason: "invalid_candidate_reference",
      };
    }

    const persistedCandidates = await transaction.projectDocumentCandidate.findMany({
      select: {
        id: true,
        type: true,
      },
      where: {
        id: {
          in: candidateIds,
        },
        projectDocumentAnalysisId: analysis.id,
      },
    });
    const persistedCandidateById = new Map(
      persistedCandidates.map((candidate) => [candidate.id, candidate]),
    );

    if (
      candidateIds.some(
        (candidateId) => !persistedCandidateById.has(candidateId),
      )
    ) {
      return {
        ok: false,
        reason: "invalid_candidate_reference",
      };
    }

    for (const candidate of input.candidates) {
      const persistedCandidate = persistedCandidateById.get(candidate.id);

      if (!persistedCandidate || !isValidEditableCandidate(candidate, persistedCandidate.type)) {
        return {
          ok: false,
          reason: "invalid_candidate_input",
        };
      }

      const quantity = candidate.quantity ?? null;
      const unitPrice = candidate.unitPrice ?? null;

      await transaction.projectDocumentCandidate.update({
        data: {
          category: candidate.category ?? null,
          description: candidate.description ?? null,
          name: candidate.name,
          notes: candidate.notes ?? null,
          quantity: toNullableDecimal(quantity),
          status: candidate.status,
          totalPrice: calculateCandidateTotalPrice(quantity, unitPrice),
          unit: candidate.unit,
          unitPrice: unitPrice === null ? null : toMoneyDecimal(unitPrice),
        },
        where: {
          id: candidate.id,
        },
      });
    }

    return {
      candidates: await getCandidatesForAnalysis(analysis.id, transaction),
      ok: true,
    };
  });
}

function mapProjectDocumentCandidate(
  candidate: DbProjectDocumentCandidate,
): ProjectDocumentCandidate {
  return {
    category: candidate.category,
    confidence: candidate.confidence?.toString() ?? null,
    createdAt: candidate.createdAt,
    description: candidate.description,
    id: candidate.id,
    importedAt: candidate.importedAt,
    importedLaborItemId: candidate.importedLaborItemId,
    importedProjectMaterialId: candidate.importedProjectMaterialId,
    name: candidate.name,
    notes: candidate.notes,
    projectDocumentAnalysisId: candidate.projectDocumentAnalysisId,
    quantity: candidate.quantity?.toString() ?? null,
    sortOrder: candidate.sortOrder,
    sourceReference: candidate.sourceReference,
    status: candidate.status,
    totalPrice: candidate.totalPrice?.toString() ?? null,
    type: candidate.type,
    unit: candidate.unit,
    unitPrice: candidate.unitPrice?.toString() ?? null,
    updatedAt: candidate.updatedAt,
  };
}

async function getCandidatesForAnalysis(
  analysisId: string,
  db: ProjectDocumentCandidateClient = prisma,
): Promise<ProjectDocumentCandidate[]> {
  const candidates = await db.projectDocumentCandidate.findMany({
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
    },
  });

  return candidates.map(mapProjectDocumentCandidate);
}

async function findOwnedCompletedAnalysis(
  projectId: string,
  documentId: string,
  analysisId: string,
  userId: string,
  db: ProjectDocumentCandidateClient = prisma,
): Promise<{ id: string } | null> {
  return db.projectDocumentAnalysis.findFirst({
    select: {
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

function isValidEditableCandidate(
  candidate: SaveProjectDocumentCandidateReviewInput["candidates"][number],
  type: ProjectDocumentCandidateType,
): boolean {
  if (type === "material") {
    return (
      candidate.category !== null &&
      candidate.category !== undefined &&
      materialCategoryValues.has(candidate.category) &&
      materialUnitValues.has(candidate.unit)
    );
  }

  return laborUnitValues.has(candidate.unit);
}

function toNullableDecimal(value: number | null): Prisma.Decimal | null {
  return value === null ? null : new Prisma.Decimal(value);
}

function toMoneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}
