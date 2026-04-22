import type {
  Material as DbMaterial,
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
import type { Material, ProjectMaterial, Quote } from "@/types/quote";

type DbProjectMaterialWithMaterial = DbProjectMaterial & {
  material: DbMaterial;
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

  const materials = await prisma.projectMaterial.findMany({
    where: {
      projectId: project.id,
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

  return {
    ok: true,
    materials: materials.map(mapProjectMaterial),
  };
}
