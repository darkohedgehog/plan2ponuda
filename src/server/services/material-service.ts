import "server-only";

import type {
  Material as DbMaterial,
  Project as DbProject,
  ProjectMaterial as DbProjectMaterial,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { UpdateMaterialInput } from "@/lib/validations/material.schema";
import type {
  Material,
  ProjectMaterialOverviewItem,
  UserMaterialSummary,
} from "@/types/quote";

type DbProjectMaterialWithProjectAndMaterial = DbProjectMaterial & {
  material: DbMaterial;
  project: Pick<DbProject, "clientName" | "id" | "name">;
};

type ProjectMaterialSummaryLine = {
  projectId: string;
  source: string;
  totalPrice: number | string | Prisma.Decimal;
};

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

function mapProjectMaterialOverviewItem(
  projectMaterial: DbProjectMaterialWithProjectAndMaterial,
): ProjectMaterialOverviewItem {
  return {
    id: projectMaterial.id,
    projectId: projectMaterial.projectId,
    materialId: projectMaterial.materialId,
    quantity: projectMaterial.quantity.toString(),
    unitPrice: projectMaterial.unitPrice.toString(),
    totalPrice: projectMaterial.totalPrice.toString(),
    source: projectMaterial.source,
    material: mapMaterial(projectMaterial.material),
    project: {
      id: projectMaterial.project.id,
      name: projectMaterial.project.name,
      clientName: projectMaterial.project.clientName ?? undefined,
    },
    createdAt: projectMaterial.createdAt,
    updatedAt: projectMaterial.updatedAt,
  };
}

export function summarizeProjectMaterials(
  materials: ProjectMaterialSummaryLine[],
): UserMaterialSummary {
  const projectIds = new Set<string>();
  let manualLineCount = 0;
  const totalMaterialValue = materials
    .reduce((total, material) => {
      projectIds.add(material.projectId);

      if (material.source === "manual") {
        manualLineCount += 1;
      }

      return total.add(material.totalPrice);
    }, new Prisma.Decimal(0))
    .toDecimalPlaces(2);

  return {
    manualLineCount,
    materialLineCount: materials.length,
    projectCount: projectIds.size,
    totalMaterialValue: totalMaterialValue.toFixed(2),
  };
}

export async function getMaterialCatalog(): Promise<Material[]> {
  const materials = await prisma.material.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return materials.map(mapMaterial);
}

export async function getUserProjectMaterials(
  userId: string,
): Promise<ProjectMaterialOverviewItem[]> {
  const materials = await prisma.projectMaterial.findMany({
    where: {
      project: {
        userId,
      },
    },
    include: {
      material: true,
      project: {
        select: {
          clientName: true,
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
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

  return materials.map(mapProjectMaterialOverviewItem);
}

export async function getUserMaterialSummary(
  userId: string,
): Promise<UserMaterialSummary> {
  const materials = await prisma.projectMaterial.findMany({
    where: {
      project: {
        userId,
      },
    },
    select: {
      projectId: true,
      source: true,
      totalPrice: true,
    },
  });

  return summarizeProjectMaterials(materials);
}

export async function updateMaterialDefaultPrice(
  materialId: string,
  input: UpdateMaterialInput,
): Promise<Material | null> {
  const material = await prisma.material
    .update({
      where: {
        id: materialId,
      },
      data: {
        defaultPrice: new Prisma.Decimal(input.defaultPrice).toDecimalPlaces(2),
      },
    })
    .catch((error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    });

  return material ? mapMaterial(material) : null;
}
