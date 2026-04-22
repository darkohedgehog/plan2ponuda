import "server-only";

import type { Material as DbMaterial } from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { UpdateMaterialInput } from "@/lib/validations/material.schema";
import type { Material } from "@/types/quote";

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
