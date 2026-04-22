import type {
  Material as DbMaterial,
  Project as DbProject,
  ProjectMaterial as DbProjectMaterial,
  Quote as DbQuote,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
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
import type {
  Material,
  ProjectMaterial,
  Quote,
  QuoteExportData,
  QuoteExportRoom,
  QuoteIndexItem,
} from "@/types/quote";

const MVP_LABOR_FACTOR = 12;

type DbProjectMaterialWithMaterial = DbProjectMaterial & {
  material: DbMaterial;
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
      reason: "not_found";
    };

type ProjectMaterialUpdateResult =
  | {
      materials: ProjectMaterial[];
      ok: true;
      quote: Quote;
    }
  | {
      ok: false;
      reason: "invalid_material_reference" | "not_found";
    };

type ProjectMaterialReadClient = Pick<typeof prisma, "projectMaterial">;
type QuoteWriteClient = Pick<typeof prisma, "projectMaterial" | "quote">;

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
): ProjectMaterial {
  return {
    id: projectMaterial.id,
    projectId: projectMaterial.projectId,
    materialId: projectMaterial.materialId,
    quantity: projectMaterial.quantity.toString(),
    unitPrice: projectMaterial.unitPrice.toString(),
    totalPrice: projectMaterial.totalPrice.toString(),
    source: projectMaterial.source,
    material: mapMaterial(projectMaterial.material),
    createdAt: projectMaterial.createdAt,
    updatedAt: projectMaterial.updatedAt,
  };
}

function toMoneyDecimal(
  value: number | string | Prisma.Decimal,
): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

export function calculateLaborCost(areaM2: number): Prisma.Decimal {
  return toMoneyDecimal(new Prisma.Decimal(areaM2).mul(MVP_LABOR_FACTOR));
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
  estimatedAreaM2: number | null;
}): QuoteExportRoom {
  const resolvedPoints = getResolvedRoomPoints(room);

  return {
    id: room.id,
    name: room.name,
    type: room.type,
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

async function recalculateQuoteFromPersistedMaterials(
  projectId: string,
  areaM2: number,
  db: QuoteWriteClient = prisma,
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
  const laborCost = calculateLaborCost(areaM2);
  const subtotal = materialCost.add(laborCost);
  const total = subtotal;

  return db.quote.upsert({
    where: {
      projectId,
    },
    update: {
      laborCost,
      materialCost,
      subtotal,
      total,
    },
    create: {
      laborCost,
      materialCost,
      projectId,
      subtotal,
      total,
    },
  });
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
    existingMaterials.map((material) => [material.materialId, material]),
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
      const unitPrice =
        existingProjectMaterial?.source === "manual"
          ? Number(existingProjectMaterial.unitPrice)
          : Number(material.defaultPrice);

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

  const materials = await getProjectMaterials(project.id);

  return {
    ok: true,
    materials: materials.map(mapProjectMaterial),
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
      areaM2: true,
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

  const quote = await recalculateQuoteFromPersistedMaterials(
    project.id,
    project.areaM2,
  );

  return {
    ok: true,
    materials: materialResult.materials,
    quote: mapQuote(quote),
  };
}

export async function getQuoteWorkspace(
  projectId: string,
  userId: string,
): Promise<QuoteGenerationResult> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      areaM2: true,
      id: true,
      quote: true,
    },
  });

  if (!project) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  if (!project.quote) {
    return generateQuote(project.id, userId);
  }

  const quote = await recalculateQuoteFromPersistedMaterials(
    project.id,
    project.areaM2,
  );
  const materials = await getProjectMaterials(project.id);

  return {
    ok: true,
    materials: materials.map(mapProjectMaterial),
    quote: mapQuote(quote),
  };
}

export async function updateProjectMaterials(
  projectId: string,
  userId: string,
  input: UpdateProjectMaterialsInput,
): Promise<ProjectMaterialUpdateResult> {
  return prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: {
        areaM2: true,
        id: true,
      },
    });

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
        },
      });
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

      await transaction.projectMaterial.update({
        where: {
          id: material.id,
        },
        data: {
          quantity: toMoneyDecimal(material.quantity),
          totalPrice: calculateLineTotal(material.quantity, material.unitPrice),
          unitPrice: toMoneyDecimal(material.unitPrice),
        },
      });
    }

    for (const material of input.manualMaterials) {
      const catalogMaterial = await transaction.material.create({
        data: {
          category: material.category,
          defaultPrice: toMoneyDecimal(material.unitPrice),
          name: material.name,
          unit: material.unit,
        },
      });

      await transaction.projectMaterial.create({
        data: {
          materialId: catalogMaterial.id,
          projectId: project.id,
          quantity: toMoneyDecimal(material.quantity),
          source: "manual",
          totalPrice: calculateLineTotal(material.quantity, material.unitPrice),
          unitPrice: toMoneyDecimal(material.unitPrice),
        },
      });
    }

    const quote = await recalculateQuoteFromPersistedMaterials(
      project.id,
      project.areaM2,
      transaction,
    );
    const materials = await getProjectMaterials(project.id, transaction);

    return {
      ok: true,
      materials: materials.map(mapProjectMaterial),
      quote: mapQuote(quote),
    };
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

  return {
    generatedAt: new Date(),
    materials: project.materials.map(mapProjectMaterial),
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
