import { QuoteWorkspaceClient } from "@/components/quote/quote-workspace-client";
import type { QuoteMaterialEditorMaterial } from "@/components/quote/quote-material-editor";
import type { ProjectMaterial, Quote } from "@/types/quote";

type QuoteSummaryProps = {
  areaM2: number;
  exportHref: string;
  materials: ProjectMaterial[];
  projectName: string;
  quote: Quote;
};

export function QuoteSummary({
  areaM2,
  exportHref,
  materials,
  projectName,
  quote,
}: QuoteSummaryProps) {
  return (
    <QuoteWorkspaceClient
      areaM2={areaM2}
      exportHref={exportHref}
      initialMaterials={materials.map(toEditorMaterial)}
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
): QuoteMaterialEditorMaterial {
  const editorMaterial: QuoteMaterialEditorMaterial = {
    category: projectMaterial.material?.category ?? "other",
    id: projectMaterial.id,
    materialId: projectMaterial.materialId,
    name: projectMaterial.material?.name ?? "Material",
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
