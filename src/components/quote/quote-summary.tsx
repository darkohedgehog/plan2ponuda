import {
  QuoteMaterialEditor,
  type QuoteMaterialEditorMaterial,
} from "@/components/quote/quote-material-editor";
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
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-blue-700">Quote workspace</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {projectName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review the material list and totals before final export.
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Project area: {formatArea(areaM2)}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Quote total
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatMoney(Number(quote.total))}
              </p>
            </div>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
              href={exportHref}
            >
              Export PDF
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuoteMetricCard
          label="Material cost"
          value={formatMoney(Number(quote.materialCost))}
        />
        <QuoteMetricCard
          label="Labor cost"
          value={formatMoney(Number(quote.laborCost))}
        />
        <QuoteMetricCard
          label="Subtotal"
          value={formatMoney(Number(quote.subtotal))}
        />
        <QuoteMetricCard
          emphasize
          label="Total"
          value={formatMoney(Number(quote.total))}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Material list
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Quantities are generated from resolved room suggestions and can be
            adjusted before export.
          </p>
        </div>

        <QuoteMaterialEditor
          initialMaterials={materials.map(toEditorMaterial)}
          projectId={quote.projectId}
        />
      </section>
    </div>
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

type QuoteMetricCardProps = {
  emphasize?: boolean;
  label: string;
  value: string;
};

function QuoteMetricCard({
  emphasize = false,
  label,
  value,
}: QuoteMetricCardProps) {
  return (
    <article
      className={`rounded-lg border p-4 shadow-sm ${
        emphasize
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          emphasize ? "text-blue-700" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("hr-HR", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function formatArea(value: number): string {
  return `${new Intl.NumberFormat("hr-HR", {
    maximumFractionDigits: 2,
  }).format(value)} m2`;
}
