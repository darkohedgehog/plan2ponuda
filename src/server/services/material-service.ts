import "server-only";

import type { Material as DbMaterial } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
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
