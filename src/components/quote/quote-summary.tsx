import type { ReactNode } from "react";

import type { ProjectMaterial } from "@/types/quote";

type QuoteSummaryProps = {
  materials: ProjectMaterial[];
  projectName: string;
};

export function QuoteSummary({ materials, projectName }: QuoteSummaryProps) {
  const materialTotal = materials.reduce(
    (total, material) => total + Number(material.totalPrice),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-blue-700">Quote workspace</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {projectName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review the rule-generated material list before quote generation.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Material total
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatMoney(materialTotal)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Material list
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Quantities are generated from resolved room suggestions.
          </p>
        </div>

        {materials.length > 0 ? (
          <MaterialList materials={materials} />
        ) : (
          <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h3 className="text-base font-semibold text-slate-950">
              No materials generated yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Review and save project rooms before generating a material list.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

type MaterialListProps = {
  materials: ProjectMaterial[];
};

function MaterialList({ materials }: MaterialListProps) {
  return (
    <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
      <div className="hidden bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.7fr)_7rem_7rem_7rem] lg:gap-4">
        <span>Material</span>
        <span>Category</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">Total</span>
      </div>

      <div className="divide-y divide-slate-200">
        {materials.map((projectMaterial) => (
          <MaterialRow
            key={projectMaterial.id}
            projectMaterial={projectMaterial}
          />
        ))}
      </div>
    </div>
  );
}

type MaterialRowProps = {
  projectMaterial: ProjectMaterial;
};

function MaterialRow({ projectMaterial }: MaterialRowProps) {
  const materialName = projectMaterial.material?.name ?? "Material";
  const category = projectMaterial.material?.category ?? "other";
  const unit = projectMaterial.material?.unit ?? "";

  return (
    <article className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.7fr)_7rem_7rem_7rem] lg:items-center lg:gap-4">
      <div className="min-w-0">
        <p className="font-semibold text-slate-950">{materialName}</p>
        {projectMaterial.material?.code ? (
          <p className="mt-1 text-xs text-slate-500">
            {projectMaterial.material.code}
          </p>
        ) : null}
      </div>

      <MaterialMobileField label="Category">
        <span className="capitalize text-slate-700">{category}</span>
      </MaterialMobileField>
      <MaterialMobileField label="Quantity" align="right">
        <span className="font-medium text-slate-800">
          {formatQuantity(projectMaterial.quantity)} {unit}
        </span>
      </MaterialMobileField>
      <MaterialMobileField label="Unit price" align="right">
        <span className="font-medium text-slate-800">
          {formatMoney(Number(projectMaterial.unitPrice))}
        </span>
      </MaterialMobileField>
      <MaterialMobileField label="Total" align="right">
        <span className="font-semibold text-slate-950">
          {formatMoney(Number(projectMaterial.totalPrice))}
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
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 lg:hidden">
        {label}
      </span>
      {children}
    </div>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("hr-HR", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function formatQuantity(value: string): string {
  const numericValue = Number(value);

  if (Number.isInteger(numericValue)) {
    return numericValue.toString();
  }

  return numericValue.toFixed(2);
}
