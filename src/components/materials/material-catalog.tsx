import { useLocale, useTranslations } from "next-intl";
import { Package } from "lucide-react";
import type { ReactNode } from "react";

import { MaterialPriceEditor } from "@/components/materials/material-price-editor";
import { getLocalizedMaterialName } from "@/lib/i18n/material-name";
import type { Material, MaterialCategory } from "@/types/quote";

type MaterialCatalogProps = {
  materials: Material[];
};

const categoryStyles: Record<MaterialCategory, string> = {
  box: "border-amber-200 bg-amber-50 text-amber-800",
  breaker: "border-red-200 bg-red-50 text-red-700",
  cable: "border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-700",
  other: "border-frosted-blue-200 bg-frosted-blue-50 text-deep-twilight-800",
  panel: "border-violet-200 bg-violet-50 text-violet-700",
  socket: "border-emerald-200 bg-emerald-50 text-emerald-700",
  switch: "border-turquoise-surf-200 bg-turquoise-surf-50 text-turquoise-surf-800",
};

export function MaterialCatalog({ materials }: MaterialCatalogProps) {
  const tCommon = useTranslations("Common");
  const tMaterials = useTranslations("Materials");

  if (materials.length === 0) {
    return <EmptyMaterialCatalog />;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-frosted-blue-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-frosted-blue-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-deep-twilight-950">
            {tMaterials("catalog.title")}
          </h2>
          <p className="mt-1 text-sm text-deep-twilight-700/70">
            {tMaterials("catalog.subtitle")}
          </p>
        </div>
      </div>

      <div className="hidden border-b border-frosted-blue-200 bg-frosted-blue-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.8fr)_7rem_13rem_9rem] lg:gap-5">
        <span>{tMaterials("fields.materialName")}</span>
        <span>{tCommon("category")}</span>
        <span>{tCommon("unit")}</span>
        <span className="text-right">{tCommon("defaultPrice")}</span>
        <span className="text-right">{tCommon("updated")}</span>
      </div>

      <div className="divide-y divide-frosted-blue-200">
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
  const locale = useLocale();
  const tCommon = useTranslations("Common");
  const tCatalogItems = useTranslations("Materials.catalogItems");
  const tMaterials = useTranslations("Materials");
  const tUnits = useTranslations("MaterialUnits");
  const displayName = getLocalizedMaterialName(material, (key) =>
    tCatalogItems(key),
  );

  return (
    <article className="grid min-w-0 gap-4 bg-white p-4 transition-colors hover:bg-frosted-blue-50/70 sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.8fr)_7rem_13rem_9rem] lg:items-center lg:gap-5">
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-deep-twilight-950">
          {displayName}
        </h3>
        {material.code ? (
          <p className="mt-1 truncate text-xs font-medium text-deep-twilight-700/70">
            {tMaterials("fields.codeValue", { code: material.code })}
          </p>
        ) : null}
      </div>

      <MaterialMobileField label={tCommon("category")}>
        <CategoryBadge category={material.category} />
      </MaterialMobileField>
      <MaterialMobileField label={tCommon("unit")}>
        <span className="text-sm font-medium text-deep-twilight-800">
          {tUnits(material.unit)}
        </span>
      </MaterialMobileField>
      <MaterialMobileField align="right" label={tCommon("defaultPrice")}>
        <MaterialPriceEditor
          defaultPrice={material.defaultPrice}
          materialId={material.id}
        />
      </MaterialMobileField>
      <MaterialMobileField align="right" label={tCommon("updated")}>
        <span className="text-sm font-medium text-deep-twilight-700">
          {formatDate(material.updatedAt, locale)}
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
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55 lg:hidden">
        {label}
      </span>
      <div className="min-w-0 text-right lg:text-inherit">{children}</div>
    </div>
  );
}

function CategoryBadge({ category }: { category: MaterialCategory }) {
  const tCategories = useTranslations("MaterialCategories");

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryStyles[category]}`}
    >
      {tCategories(category)}
    </span>
  );
}

function EmptyMaterialCatalog() {
  const tEmptyState = useTranslations("EmptyStates.materials.noMaterials");

  return (
    <section className="rounded-lg border border-dashed border-frosted-blue-300 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
        <Package aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-deep-twilight-950">
        {tEmptyState("title")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-deep-twilight-700">
        {tEmptyState("description")}
      </p>
    </section>
  );
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
