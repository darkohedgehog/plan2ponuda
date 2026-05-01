import type { ReactNode } from "react";

import { MaterialPriceEditor } from "@/components/materials/material-price-editor";
import type { Material, MaterialCategory } from "@/types/quote";

type MaterialCatalogProps = {
  materials: Material[];
};

const categoryStyles: Record<MaterialCategory, string> = {
  box: "border-amber-200 bg-amber-50 text-amber-800",
  breaker: "border-red-200 bg-red-50 text-red-700",
  cable: "border-sky-200 bg-sky-50 text-sky-700",
  other: "border-slate-200 bg-slate-50 text-slate-700",
  panel: "border-violet-200 bg-violet-50 text-violet-700",
  socket: "border-emerald-200 bg-emerald-50 text-emerald-700",
  switch: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function MaterialCatalog({ materials }: MaterialCatalogProps) {
  if (materials.length === 0) {
    return <EmptyMaterialCatalog />;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950">
            Catalog materials
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing persisted material records, newest updates included.
          </p>
        </div>
      </div>

      <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.8fr)_7rem_13rem_9rem] lg:gap-5">
        <span>Material</span>
        <span>Category</span>
        <span>Unit</span>
        <span className="text-right">Default price</span>
        <span className="text-right">Updated</span>
      </div>

      <div className="divide-y divide-slate-200">
        {materials.map((material) => (
          <MaterialCatalogRow key={material.id} material={material} />
        ))}
      </div>
    </section>
  );
}

type MaterialCatalogRowProps = {
  material: Material;
};

function MaterialCatalogRow({ material }: MaterialCatalogRowProps) {
  return (
    <article className="grid min-w-0 gap-4 bg-white p-4 transition-colors hover:bg-slate-50/70 sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.8fr)_7rem_13rem_9rem] lg:items-center lg:gap-5">
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-slate-950">
          {material.name}
        </h3>
        {material.code ? (
          <p className="mt-1 truncate text-xs font-medium text-slate-500">
            {material.code}
          </p>
        ) : null}
      </div>

      <MaterialMobileField label="Category">
        <CategoryBadge category={material.category} />
      </MaterialMobileField>
      <MaterialMobileField label="Unit">
        <span className="text-sm font-medium text-slate-700">
          {formatUnit(material.unit)}
        </span>
      </MaterialMobileField>
      <MaterialMobileField align="right" label="Default price">
        <MaterialPriceEditor
          defaultPrice={material.defaultPrice}
          materialId={material.id}
        />
      </MaterialMobileField>
      <MaterialMobileField align="right" label="Updated">
        <span className="text-sm font-medium text-slate-600">
          {formatDate(material.updatedAt)}
        </span>
      </MaterialMobileField>
    </article>
  );
}

type MaterialMobileFieldProps = {
  align?: "left" | "right";
  children: ReactNode;
  label: string;
};

function MaterialMobileField({
  align = "left",
  children,
  label,
}: MaterialMobileFieldProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 lg:block ${
        align === "right" ? "lg:text-right" : ""
      }`}
    >
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400 lg:hidden">
        {label}
      </span>
      <div className="min-w-0 text-right lg:text-inherit">{children}</div>
    </div>
  );
}

function CategoryBadge({ category }: { category: MaterialCategory }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${categoryStyles[category]}`}
    >
      {category}
    </span>
  );
}

function EmptyMaterialCatalog() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 7h16" />
          <path d="M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path d="M9 11h6" />
          <path d="M9 15h4" />
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-950">
        No materials yet
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Materials will appear here after a project quote generates and persists
        catalog records.
      </p>
    </section>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatUnit(unit: Material["unit"]): string {
  const labels: Record<Material["unit"], string> = {
    m: "Meters",
    pcs: "Pieces",
    set: "Set",
  };

  return labels[unit];
}
