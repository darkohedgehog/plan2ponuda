import type {
  Material as DbMaterial,
  Project as DbProject,
  ProjectMaterial as DbProjectMaterial,
  Quote as DbQuote,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  getManualProjectMaterialSnapshot,
  resolveGeneratedProjectMaterialUnitPrice,
} from "@/lib/materials/project-materials";
import {
  aggregateProjectPoints,
  calculateMaterialTotals,
  generateProjectMaterials,
  type MaterialRuleLine,
  type ResolvedRoomPoints,
} from "@/lib/rules/material-rules";
import {
  generateRoomSuggestions,
  resolveRoomSuggestion,
} from "@/lib/rules/room-rules";
import type { UpdateProjectMaterialsInput } from "@/lib/validations/quote.schema";
import {
  consumeUsageOrThrow,
  UsageLimitExceededError,
} from "@/server/services/billing-service";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LABOR_FACTOR,
  getUserLaborFactor,
} from "@/server/services/settings-service";
import { getQuoteWorkspaceMaterialState } from "@/server/services/quote-workspace-state";
import type {
  Material,
  ProjectMaterial,
  ProjectMaterialDocumentCandidateSource,
  Quote,
  QuoteExportData,
  QuoteExportRoom,
  QuoteIndexItem,
} from "@/types/quote";

type DbProjectMaterialWithMaterial = DbProjectMaterial & {
  material: DbMaterial | null;
};

type DbQuoteWithProject = DbQuote & {
  project: Pick<DbProject, "clientName" | "id" | "name" | "objectType">;
};

type ProjectMaterialGenerationResult =
  | {
      materials: ProjectMaterial[];
      ok: true;
    }
  | {
      ok: false;
      reason: "not_found";
    };

type QuoteGenerationResult =
  | {
      materials: ProjectMaterial[];
      ok: true;
      quote: Quote;
    }
  | {
      ok: false;
      reason: "not_found" | "quote_limit_reached";
    };

type QuoteWorkspaceResult =
  | QuoteGenerationResult
  | {
      ok: false;
      reason: "needs_room_review" | "quote_limit_reached";
    };

type ProjectMaterialUpdateResult =
  | {
      materials: ProjectMaterial[];
      ok: true;
      quote: Quote;
    }
  | {
      ok: false;
      reason: "invalid_material_reference" | "not_found" | "quote_limit_reached";
    };

type ProjectMaterialReadClient = Pick<
  typeof prisma,
  "projectDocumentCandidate" | "projectMaterial"
>;
type QuoteWriteClient = Pick<
  typeof prisma,
  | "$queryRaw"
  | "project"
  | "projectDocumentCandidate"
  | "projectMaterial"
  | "quote"
  | "subscription"
  | "usageCounter"
>;

type LockedQuoteProject = {
  areaM2: number;
  id: string;
};

type LockedQuoteProjectRow = {
  areaM2: number;
  id: string;
};

function mapQuote(quote: DbQuote): Quote {
  return {
    id: quote.id,
    projectId: quote.projectId,
    laborCost: quote.laborCost.toString(),
    materialCost: quote.materialCost.toString(),
    subtotal: quote.subtotal.toString(),
    total: quote.total.toString(),
    pdfPath: quote.pdfPath ?? undefined,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}

function mapQuoteIndexItem(quote: DbQuoteWithProject): QuoteIndexItem {
  return {
    ...mapQuote(quote),
    project: {
      id: quote.project.id,
      name: quote.project.name,
      clientName: quote.project.clientName ?? undefined,
      objectType: quote.project.objectType,
    },
  };
}

function mapMaterial(material: DbMaterial): Material {
  return {
    id: material.id,
    code: material.code ?? undefined,
    name: material.name,
    unit: material.unit,
    defaultPrice: material.defaultPrice.toString(),
    category: material.category,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

function mapProjectMaterial(
  projectMaterial: DbProjectMaterialWithMaterial,
  documentCandidateSource?: ProjectMaterialDocumentCandidateSource,
): ProjectMaterial {
  const mappedMaterial: ProjectMaterial = {
    id: projectMaterial.id,
    projectId: projectMaterial.projectId,
    materialId: projectMaterial.materialId ?? undefined,
    manualCategory: projectMaterial.manualCategory ?? undefined,
    manualName: projectMaterial.manualName ?? undefined,
    manualUnit: projectMaterial.manualUnit ?? undefined,
    quantity: projectMaterial.quantity.toString(),
    unitPrice: projectMaterial.unitPrice.toString(),
    totalPrice: projectMaterial.totalPrice.toString(),
    source: projectMaterial.source,
    material: projectMaterial.material
      ? mapMaterial(projectMaterial.material)
      : undefined,
    createdAt: projectMaterial.createdAt,
    updatedAt: projectMaterial.updatedAt,
  };

  if (documentCandidateSource) {
    return {
      ...mappedMaterial,
      documentCandidateSource,
    };
  }

  return mappedMaterial;
}

function toMoneyDecimal(
  value: number | string | Prisma.Decimal,
): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

export function calculateLaborCost(
  areaM2: number,
  laborFactor: number | string | Prisma.Decimal = DEFAULT_LABOR_FACTOR,
): Prisma.Decimal {
  return toMoneyDecimal(new Prisma.Decimal(areaM2).mul(laborFactor));
}

function calculateMaterialCost(
  materials: Pick<DbProjectMaterial, "totalPrice">[],
): Prisma.Decimal {
  return materials.reduce(
    (total, material) => total.add(material.totalPrice),
    toMoneyDecimal(0),
  );
}

function calculateLineTotal(quantity: number, unitPrice: number): Prisma.Decimal {
  return toMoneyDecimal(new Prisma.Decimal(quantity).mul(unitPrice));
}

function hasDuplicateIds(ids: string[]): boolean {
  return new Set(ids).size !== ids.length;
}

function isQuoteLimitExceededError(error: unknown): boolean {
  return (
    error instanceof UsageLimitExceededError &&
    error.type === "quotes_created"
  );
}

export async function findAndLockProjectForQuote(
  db: QuoteWriteClient,
  projectId: string,
  userId: string,
): Promise<LockedQuoteProject | null> {
  const rows = await db.$queryRaw<LockedQuoteProjectRow[]>`
    SELECT id, "areaM2"
    FROM "Project"
    WHERE id = ${projectId} AND "userId" = ${userId}
    FOR UPDATE
  `;
  const project = rows[0];

  if (!project) {
    return null;
  }

  return {
    areaM2: project.areaM2,
    id: project.id,
  };
}

function getResolvedRoomPoints(
  room: {
    estimatedAreaM2: number | null;
    suggestion: {
      suggestedLights: number;
      suggestedSockets: number;
      suggestedSwitches: number;
      userLights: number | null;
      userSockets: number | null;
      userSwitches: number | null;
    } | null;
    type: Parameters<typeof generateRoomSuggestions>[0]["type"];
  },
): ResolvedRoomPoints {
  const generatedSuggestion = room.suggestion
    ? {
        suggestedLights: room.suggestion.suggestedLights,
        suggestedSockets: room.suggestion.suggestedSockets,
        suggestedSwitches: room.suggestion.suggestedSwitches,
      }
    : generateRoomSuggestions({
        estimatedAreaM2: room.estimatedAreaM2 ?? undefined,
        type: room.type,
      });
  const resolvedSuggestion = resolveRoomSuggestion(generatedSuggestion, {
    userLights: room.suggestion?.userLights ?? undefined,
    userSockets: room.suggestion?.userSockets ?? undefined,
    userSwitches: room.suggestion?.userSwitches ?? undefined,
  });

  return {
    resolvedLights: resolvedSuggestion.resolvedLights,
    resolvedSockets: resolvedSuggestion.resolvedSockets,
    resolvedSwitches: resolvedSuggestion.resolvedSwitches,
  };
}

function mapQuoteExportRoom(room: {
  confidence: number | null;
  estimatedAreaM2: number | null;
  id: string;
  name: string;
  suggestion: {
    suggestedLights: number;
    suggestedSockets: number;
    suggestedSwitches: number;
    userLights: number | null;
    userSockets: number | null;
    userSwitches: number | null;
  } | null;
  type: Parameters<typeof generateRoomSuggestions>[0]["type"];
}): QuoteExportRoom {
  const generatedSuggestion = room.suggestion
    ? {
        suggestedLights: room.suggestion.suggestedLights,
        suggestedSockets: room.suggestion.suggestedSockets,
        suggestedSwitches: room.suggestion.suggestedSwitches,
      }
    : generateRoomSuggestions({
        estimatedAreaM2: room.estimatedAreaM2 ?? undefined,
        type: room.type,
      });
  const resolvedPoints = getResolvedRoomPoints(room);

  return {
    confidence: room.confidence,
    estimatedAreaM2: room.estimatedAreaM2,
    id: room.id,
    name: room.name,
    type: room.type,
    suggestedLights: generatedSuggestion.suggestedLights,
    suggestedSockets: generatedSuggestion.suggestedSockets,
    suggestedSwitches: generatedSuggestion.suggestedSwitches,
    ...resolvedPoints,
  };
}

async function getOrCreateMaterialCatalog(
  lines: MaterialRuleLine[],
): Promise<Map<string, DbMaterial>> {
  const materials = new Map<string, DbMaterial>();

  for (const line of lines) {
    const material = await prisma.material.upsert({
      where: {
        code: line.code,
      },
      update: {
        category: line.category,
        name: line.name,
        unit: line.unit,
      },
      create: {
        category: line.category,
        code: line.code,
        defaultPrice: toMoneyDecimal(0),
        name: line.name,
        unit: line.unit,
      },
    });

    materials.set(line.code, material);
  }

  return materials;
}

async function getProjectMaterials(
  projectId: string,
  db: ProjectMaterialReadClient = prisma,
): Promise<DbProjectMaterialWithMaterial[]> {
  return db.projectMaterial.findMany({
    where: {
      projectId,
    },
    include: {
      material: true,
    },
    orderBy: [
      {
        manualCategory: "asc",
      },
      {
        manualName: "asc",
      },
      {
        material: {
          category: "asc",
        },
      },
      {
        material: {
          name: "asc",
        },
      },
    ],
  });
}

async function getProjectMaterialDocumentCandidateSources(
  projectMaterialIds: string[],
  db: ProjectMaterialReadClient = prisma,
): Promise<Map<string, ProjectMaterialDocumentCandidateSource>> {
  if (projectMaterialIds.length === 0) {
    return new Map();
  }

  const candidates = await db.projectDocumentCandidate.findMany({
    select: {
      analysis: {
        select: {
          document: {
            select: {
              fileName: true,
            },
          },
        },
      },
      confidence: true,
      id: true,
      importedAt: true,
      importedProjectMaterialId: true,
      projectDocumentAnalysisId: true,
      sourceReference: true,
    },
    where: {
      importedProjectMaterialId: {
        in: projectMaterialIds,
      },
    },
  });

  return new Map(
    candidates.flatMap((candidate) =>
      candidate.importedProjectMaterialId
        ? [
            [
              candidate.importedProjectMaterialId,
              {
                analysisId: candidate.projectDocumentAnalysisId,
                candidateId: candidate.id,
                confidence: candidate.confidence?.toString() ?? null,
                documentName: candidate.analysis.document.fileName,
                importedAt: candidate.importedAt,
                sourceReference: candidate.sourceReference,
              },
            ] as const,
          ]
        : [],
    ),
  );
}

async function getMappedProjectMaterials(
  projectId: string,
  db: ProjectMaterialReadClient = prisma,
): Promise<ProjectMaterial[]> {
  const materials = await getProjectMaterials(projectId, db);
  const sourceByProjectMaterialId =
    await getProjectMaterialDocumentCandidateSources(
      materials.map((material) => material.id),
      db,
    );

  return materials.map((material) =>
    mapProjectMaterial(material, sourceByProjectMaterialId.get(material.id)),
  );
}

export async function recalculateQuoteFromPersistedMaterials(
  projectId: string,
  areaM2: number,
  laborFactor: number | string | Prisma.Decimal,
  db: QuoteWriteClient = prisma,
  options: {
    consumeFirstQuoteForUserId?: string;
  } = {},
): Promise<DbQuote> {
  const persistedMaterials = await db.projectMaterial.findMany({
    where: {
      projectId,
    },
    select: {
      totalPrice: true,
    },
  });
  const materialCost = calculateMaterialCost(persistedMaterials);
  const laborCost = calculateLaborCost(areaM2, laborFactor);
  const subtotal = materialCost.add(laborCost);
  const total = subtotal;
  const currentQuote = await db.quote.findUnique({
    select: {
      id: true,
    },
    where: {
      projectId,
    },
  });

  if (!currentQuote && options.consumeFirstQuoteForUserId) {
    await consumeUsageOrThrow(
      db,
      options.consumeFirstQuoteForUserId,
      "quotes_created",
    );
  }

  const quoteData = {
    laborCost,
    materialCost,
    subtotal,
    total,
  };
  const quote = currentQuote
    ? await db.quote.update({
        data: quoteData,
        where: {
          projectId,
        },
      })
    : await db.quote.create({
        data: {
          ...quoteData,
          projectId,
        },
      });

  await db.project.update({
    where: {
      id: projectId,
    },
    data: {
      status: "quoted",
    },
  });

  return quote;
}

export async function getQuoteForProject(
  projectId: string,
  userId: string,
): Promise<Quote | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      quote: true,
    },
  });

  if (!project?.quote) {
    return null;
  }

  return mapQuote(project.quote);
}

export async function getUserQuotes(userId: string): Promise<QuoteIndexItem[]> {
  const quotes = await prisma.quote.findMany({
    where: {
      project: {
        userId,
      },
    },
    include: {
      project: {
        select: {
          clientName: true,
          id: true,
          name: true,
          objectType: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return quotes.map(mapQuoteIndexItem);
}

export async function createQuotePlaceholder(
  projectId: string,
  userId: string,
): Promise<Quote | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return null;
  }

  return null;
}

export async function generateProjectMaterialList(
  projectId: string,
  userId: string,
): Promise<ProjectMaterialGenerationResult> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
      rooms: {
        include: {
          suggestion: true,
        },
      },
    },
  });

  if (!project) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  if (project.rooms.length === 0) {
    await prisma.projectMaterial.deleteMany({
      where: {
        projectId: project.id,
        source: "rule",
      },
    });

    return {
      ok: true,
      materials: [],
    };
  }

  const totals = aggregateProjectPoints(project.rooms.map(getResolvedRoomPoints));
  const ruleLines = generateProjectMaterials(totals);
  const materialCatalog = await getOrCreateMaterialCatalog(ruleLines);
  const existingMaterials = await prisma.projectMaterial.findMany({
    where: {
      projectId: project.id,
    },
  });
  const existingMaterialByMaterialId = new Map(
    existingMaterials.flatMap((material) =>
      material.materialId ? [[material.materialId, material] as const] : [],
    ),
  );
  const pricedLines = calculateMaterialTotals(
    ruleLines.map((line) => {
      const material = materialCatalog.get(line.code);

      if (!material) {
        throw new Error(`Missing material catalog entry for ${line.code}`);
      }

      const existingProjectMaterial = existingMaterialByMaterialId.get(
        material.id,
      );
      const unitPrice = resolveGeneratedProjectMaterialUnitPrice({
        catalogDefaultPrice: Number(material.defaultPrice),
        existingUnitPrice: existingProjectMaterial
          ? Number(existingProjectMaterial.unitPrice)
          : undefined,
      });

      return {
        ...line,
        unitPrice,
      };
    }),
  );
  const materialIdsToKeep: string[] = [];

  for (const line of pricedLines) {
    const material = materialCatalog.get(line.code);

    if (!material) {
      throw new Error(`Missing material catalog entry for ${line.code}`);
    }

    materialIdsToKeep.push(material.id);

    const existingProjectMaterial = existingMaterialByMaterialId.get(
      material.id,
    );
    const source =
      existingProjectMaterial?.source === "manual" ? "manual" : "rule";

    await prisma.projectMaterial.upsert({
      where: {
        projectId_materialId: {
          materialId: material.id,
          projectId: project.id,
        },
      },
      update: {
        quantity: toMoneyDecimal(line.quantity),
        source,
        totalPrice: toMoneyDecimal(line.totalPrice),
        unitPrice: toMoneyDecimal(line.unitPrice),
      },
      create: {
        materialId: material.id,
        projectId: project.id,
        quantity: toMoneyDecimal(line.quantity),
        source,
        totalPrice: toMoneyDecimal(line.totalPrice),
        unitPrice: toMoneyDecimal(line.unitPrice),
      },
    });
  }

  await prisma.projectMaterial.deleteMany({
    where: {
      projectId: project.id,
      source: "rule",
      materialId: {
        notIn: materialIdsToKeep,
      },
    },
  });

  return {
    ok: true,
    materials: await getMappedProjectMaterials(project.id),
  };
}

export async function generateQuote(
  projectId: string,
  userId: string,
): Promise<QuoteGenerationResult> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  const materialResult = await generateProjectMaterialList(project.id, userId);

  if (!materialResult.ok) {
    return materialResult;
  }

  const laborFactor = await getUserLaborFactor(userId);
  const quote = await prisma
    .$transaction(async (transaction) => {
      const lockedProject = await findAndLockProjectForQuote(
        transaction,
        project.id,
        userId,
      );

      if (!lockedProject) {
        return null;
      }

      return recalculateQuoteFromPersistedMaterials(
        lockedProject.id,
        lockedProject.areaM2,
        laborFactor,
        transaction,
        {
          consumeFirstQuoteForUserId: userId,
        },
      );
    })
    .catch((error: unknown) => {
      if (isQuoteLimitExceededError(error)) {
        return "quote_limit_reached" as const;
      }

      throw error;
    });

  if (quote === "quote_limit_reached") {
    return {
      ok: false,
      reason: "quote_limit_reached",
    };
  }

  if (!quote) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  return {
    ok: true,
    materials: materialResult.materials,
    quote: mapQuote(quote),
  };
}

export async function getQuoteWorkspace(
  projectId: string,
  userId: string,
): Promise<QuoteWorkspaceResult> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
      status: true,
      _count: {
        select: {
          materials: true,
          rooms: true,
        },
      },
    },
  });

  if (!project) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  const materialState = getQuoteWorkspaceMaterialState({
    projectMaterialCount: project._count.materials,
    projectStatus: project.status,
    roomCount: project._count.rooms,
  });

  if (materialState === "needs_room_review") {
    return {
      ok: false,
      reason: "needs_room_review",
    };
  }

  if (materialState === "generate_initial_materials") {
    return generateQuote(project.id, userId);
  }

  const laborFactor = await getUserLaborFactor(userId);
  const quote = await prisma
    .$transaction(async (transaction) => {
      const lockedProject = await findAndLockProjectForQuote(
        transaction,
        project.id,
        userId,
      );

      if (!lockedProject) {
        return null;
      }

      return recalculateQuoteFromPersistedMaterials(
        lockedProject.id,
        lockedProject.areaM2,
        laborFactor,
        transaction,
        {
          consumeFirstQuoteForUserId: userId,
        },
      );
    })
    .catch((error: unknown) => {
      if (isQuoteLimitExceededError(error)) {
        return "quote_limit_reached" as const;
      }

      throw error;
    });

  if (quote === "quote_limit_reached") {
    return {
      ok: false,
      reason: "quote_limit_reached",
    };
  }

  if (!quote) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  return {
    ok: true,
    materials: await getMappedProjectMaterials(project.id),
    quote: mapQuote(quote),
  };
}

export async function updateProjectMaterials(
  projectId: string,
  userId: string,
  input: UpdateProjectMaterialsInput,
): Promise<ProjectMaterialUpdateResult> {
  return prisma
    .$transaction(async (transaction): Promise<ProjectMaterialUpdateResult> => {
      const project = await findAndLockProjectForQuote(
        transaction,
        projectId,
        userId,
      );

      if (!project) {
        return {
          ok: false,
          reason: "not_found",
        };
      }

      const existingMaterialIds = input.existingMaterials.map(
        (material) => material.id,
      );
      const referencedMaterialIds = [
        ...existingMaterialIds,
        ...input.deletedMaterialIds,
      ];
      let existingProjectMaterialById = new Map<
        string,
        {
          materialId: string | null;
          source: string;
        }
      >();

      if (
        hasDuplicateIds(existingMaterialIds) ||
        hasDuplicateIds(input.deletedMaterialIds)
      ) {
        return {
          ok: false,
          reason: "invalid_material_reference",
        };
      }

      if (referencedMaterialIds.length > 0) {
        const referencedMaterials = await transaction.projectMaterial.findMany({
          where: {
            id: {
              in: referencedMaterialIds,
            },
            projectId: project.id,
          },
          select: {
            id: true,
            materialId: true,
            source: true,
          },
        });
        existingProjectMaterialById = new Map(
          referencedMaterials.map((material) => [
            material.id,
            {
              materialId: material.materialId,
              source: material.source,
            },
          ]),
        );
        const validMaterialIds = new Set(
          referencedMaterials.map((material) => material.id),
        );

        if (
          referencedMaterialIds.some(
            (materialId) => !validMaterialIds.has(materialId),
          )
        ) {
          return {
            ok: false,
            reason: "invalid_material_reference",
          };
        }
      }

      if (input.deletedMaterialIds.length > 0) {
        await transaction.projectMaterial.deleteMany({
          where: {
            id: {
              in: input.deletedMaterialIds,
            },
            projectId: project.id,
          },
        });
      }

      const deletedMaterialIds = new Set(input.deletedMaterialIds);

      for (const material of input.existingMaterials) {
        if (deletedMaterialIds.has(material.id)) {
          continue;
        }

        const existingProjectMaterial = existingProjectMaterialById.get(
          material.id,
        );
        const updateData: Prisma.ProjectMaterialUpdateInput = {
          quantity: toMoneyDecimal(material.quantity),
          totalPrice: calculateLineTotal(
            material.quantity,
            material.unitPrice,
          ),
          unitPrice: toMoneyDecimal(material.unitPrice),
        };

        if (
          existingProjectMaterial?.materialId === null &&
          existingProjectMaterial.source === "manual" &&
          material.category &&
          material.name &&
          material.unit
        ) {
          Object.assign(
            updateData,
            getManualProjectMaterialSnapshot({
              category: material.category,
              name: material.name,
              unit: material.unit,
            }),
          );
        }

        await transaction.projectMaterial.update({
          where: {
            id: material.id,
          },
          data: updateData,
        });
      }

      for (const material of input.manualMaterials) {
        const manualSnapshot = getManualProjectMaterialSnapshot(material);

        await transaction.projectMaterial.create({
          data: {
            ...manualSnapshot,
            projectId: project.id,
            quantity: toMoneyDecimal(material.quantity),
            source: "manual",
            totalPrice: calculateLineTotal(
              material.quantity,
              material.unitPrice,
            ),
            unitPrice: toMoneyDecimal(material.unitPrice),
          },
        });
      }

      const laborFactor = await getUserLaborFactor(userId, transaction);
      const quote = await recalculateQuoteFromPersistedMaterials(
        project.id,
        project.areaM2,
        laborFactor,
        transaction,
        {
          consumeFirstQuoteForUserId: userId,
        },
      );

      return {
        ok: true,
        materials: await getMappedProjectMaterials(project.id, transaction),
        quote: mapQuote(quote),
      };
    })
    .catch((error: unknown) => {
      if (isQuoteLimitExceededError(error)) {
        return {
          ok: false as const,
          reason: "quote_limit_reached" as const,
        };
      }

      throw error;
    });
}

export async function getQuoteExportData(
  projectId: string,
  userId: string,
): Promise<QuoteExportData | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      materials: {
        include: {
          material: true,
        },
        orderBy: [
          {
            material: {
              category: "asc",
            },
          },
          {
            material: {
              name: "asc",
            },
          },
        ],
      },
      quote: true,
      user: {
        select: {
          companyName: true,
          fullName: true,
          settings: {
            select: {
              companyAddress: true,
              companyCity: true,
              companyCountry: true,
              companyEmail: true,
              companyPhone: true,
              companyTaxId: true,
              currency: true,
            },
          },
        },
      },
      rooms: {
        include: {
          suggestion: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  if (!project?.quote) {
    return null;
  }

  const sourceByProjectMaterialId =
    await getProjectMaterialDocumentCandidateSources(
      project.materials.map((material) => material.id),
    );

  return {
    company: {
      companyAddress: project.user.settings?.companyAddress ?? undefined,
      companyCity: project.user.settings?.companyCity ?? undefined,
      companyCountry: project.user.settings?.companyCountry ?? undefined,
      companyEmail: project.user.settings?.companyEmail ?? undefined,
      companyName: project.user.companyName ?? undefined,
      companyPhone: project.user.settings?.companyPhone ?? undefined,
      companyTaxId: project.user.settings?.companyTaxId ?? undefined,
      fullName: project.user.fullName ?? undefined,
    },
    currency: project.user.settings?.currency ?? DEFAULT_CURRENCY,
    generatedAt: new Date(),
    materials: project.materials.map((material) =>
      mapProjectMaterial(material, sourceByProjectMaterialId.get(material.id)),
    ),
    project: {
      id: project.id,
      name: project.name,
      clientName: project.clientName ?? undefined,
      objectType: project.objectType,
      areaM2: project.areaM2,
    },
    quote: mapQuote(project.quote),
    rooms: project.rooms.map(mapQuoteExportRoom),
  };
}
