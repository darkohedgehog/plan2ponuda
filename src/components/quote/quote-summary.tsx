import { getTranslations } from "next-intl/server";

import { QuoteWorkspaceClient } from "@/components/quote/quote-workspace-client";
import type { QuoteMaterialEditorMaterial } from "@/components/quote/quote-material-editor";
import type { ProjectMaterial, Quote } from "@/types/quote";

type QuoteSummaryProps = {
  areaM2: number;
  excelHref: string;
  exportHref: string;
  materials: ProjectMaterial[];
  projectName: string;
  quote: Quote;
};

export async function QuoteSummary({
  areaM2,
  excelHref,
  exportHref,
  materials,
  projectName,
  quote,
}: QuoteSummaryProps) {
  const tMaterials = await getTranslations("Materials");
  const fallbackMaterialName = tMaterials("fallbackName");

  return (
    <QuoteWorkspaceClient
      areaM2={areaM2}
      excelHref={excelHref}
      exportHref={exportHref}
      initialMaterials={materials.map((material) =>
        toEditorMaterial(material, fallbackMaterialName),
      )}
      initialQuote={{
        laborCost: quote.laborCost,
        materialCost: quote.materialCost,
        projectId: quote.projectId,
        subtotal: quote.subtotal,
        total: quote.total,
      }}
      projectName={projectName}
    />
  );
}

function toEditorMaterial(
  projectMaterial: ProjectMaterial,
  fallbackMaterialName: string,
): QuoteMaterialEditorMaterial {
  const editorMaterial: QuoteMaterialEditorMaterial = {
    category: projectMaterial.material?.category ?? "other",
    id: projectMaterial.id,
    materialId: projectMaterial.materialId,
    name: projectMaterial.material?.name ?? fallbackMaterialName,
    quantity: projectMaterial.quantity,
    source: projectMaterial.source,
    totalPrice: projectMaterial.totalPrice,
    unit: projectMaterial.material?.unit ?? "pcs",
    unitPrice: projectMaterial.unitPrice,
  };

  if (projectMaterial.material?.code) {
    return {
      ...editorMaterial,
      code: projectMaterial.material.code,
    };
  }

  return editorMaterial;
}
