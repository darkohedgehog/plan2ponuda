import { ArrowRight, FilePenLine } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { getLocalizedMaterialName } from "@/lib/i18n/material-name";
import { getProjectMaterialDisplaySnapshot } from "@/lib/materials/project-materials";
import type {
  MaterialCategory,
  ProjectMaterialOverviewItem,
} from "@/types/quote";

type ProjectMaterialsOverviewProps = {
  materials: ProjectMaterialOverviewItem[];
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

export function ProjectMaterialsOverview({
  materials,
}: ProjectMaterialsOverviewProps) {
  const tProjectMaterials = useTranslations("ProjectMaterials");

  if (materials.length === 0) {
    return <EmptyProjectMaterialsOverview />;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-frosted-blue-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-frosted-blue-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-deep-twilight-950">
            {tProjectMaterials("title")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-deep-twilight-700/70">
            {tProjectMaterials("subtitle")}
          </p>
        </div>
        <p className="rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 py-2 text-sm font-medium text-deep-twilight-700">
          {tProjectMaterials("editingNote")}
        </p>
      </div>

      <div className="hidden border-b border-frosted-blue-200 bg-frosted-blue-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55 2xl:grid 2xl:grid-cols-[minmax(12rem,1.25fr)_minmax(12rem,1.25fr)_minmax(7rem,0.7fr)_minmax(7rem,0.65fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(8rem,0.65fr)] 2xl:gap-4">
        <span>{tProjectMaterials("fields.project")}</span>
        <span>{tProjectMaterials("fields.material")}</span>
        <span>{tProjectMaterials("fields.category")}</span>
        <span className="text-right">
          {tProjectMaterials("fields.quantityUnit")}
        </span>
        <span className="text-right">
          {tProjectMaterials("fields.unitPrice")}
        </span>
        <span className="text-right">
          {tProjectMaterials("fields.totalPrice")}
        </span>
        <span>{tProjectMaterials("fields.source")}</span>
        <span className="text-right">{tProjectMaterials("fields.action")}</span>
      </div>

      <div className="divide-y divide-frosted-blue-200">
        {materials.map((material) => (
          <ProjectMaterialRow key={material.id} material={material} />
        ))}
      </div>
    </section>
  );
}

type ProjectMaterialRowProps = {
  material: ProjectMaterialOverviewItem;
};

function ProjectMaterialRow({ material }: ProjectMaterialRowProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tCatalogItems = useTranslations("Materials.catalogItems");
  const tCommon = useTranslations("Common");
  const tMaterials = useTranslations("Materials");
  const tProjectMaterials = useTranslations("ProjectMaterials");
  const tUnits = useTranslations("MaterialUnits");
  const displayMaterial = getProjectMaterialDisplaySnapshot(
    material,
    tMaterials("fallbackName"),
  );
  const materialName = getLocalizedMaterialName(
    {
      code: displayMaterial.code,
      name: displayMaterial.name,
      source: material.source,
    },
    (key) => tCatalogItems(key),
  );

  return (
    <article className="grid min-w-0 gap-4 bg-white p-4 transition-colors hover:bg-frosted-blue-50/70 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(8rem,0.7fr)] 2xl:grid-cols-[minmax(12rem,1.25fr)_minmax(12rem,1.25fr)_minmax(7rem,0.7fr)_minmax(7rem,0.65fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(8rem,0.65fr)] 2xl:items-center 2xl:gap-4">
      <ProjectMaterialField
        className="sm:col-span-2 lg:col-span-1"
        label={tProjectMaterials("fields.project")}
      >
        <div className="min-w-0">
          <p className="wrap-break-word text-sm font-semibold leading-5 text-deep-twilight-950 2xl:truncate">
            {material.project.name}
          </p>
          {material.project.clientName ? (
            <p className="mt-1 truncate text-xs font-medium text-deep-twilight-700/70">
              {material.project.clientName}
            </p>
          ) : null}
        </div>
      </ProjectMaterialField>

      <ProjectMaterialField label={tProjectMaterials("fields.material")}>
        <div className="min-w-0">
          <p className="wrap-break-word text-sm font-semibold leading-5 text-deep-twilight-950 2xl:truncate">
            {materialName}
          </p>
          {displayMaterial.code ? (
            <p className="mt-1 break-all font-mono text-xs text-deep-twilight-700/70">
              {displayMaterial.code}
            </p>
          ) : null}
        </div>
      </ProjectMaterialField>

      <ProjectMaterialField label={tCommon("category")}>
        <CategoryBadge category={displayMaterial.category} />
      </ProjectMaterialField>

      <ProjectMaterialField align="right" label={tCommon("quantity")}>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="text-sm font-semibold tabular-nums text-deep-twilight-950">
            {formatDecimal(material.quantity, locale)}
          </span>
          <span className="inline-flex shrink-0 rounded-md bg-frosted-blue-50 px-2 py-1 text-xs font-semibold text-deep-twilight-700 ring-1 ring-frosted-blue-200">
            {tUnits(displayMaterial.unit)}
          </span>
        </div>
      </ProjectMaterialField>

      <ProjectMaterialField align="right" label={tCommon("unitPrice")}>
        <span className="text-sm font-semibold tabular-nums text-deep-twilight-950">
          {formatMoney(material.unitPrice, locale)}
        </span>
      </ProjectMaterialField>

      <ProjectMaterialField align="right" label={tCommon("totalPrice")}>
        <span className="text-sm font-semibold tabular-nums text-deep-twilight-950">
          {formatMoney(material.totalPrice, locale)}
        </span>
      </ProjectMaterialField>

      <ProjectMaterialField label={tCommon("source")}>
        <SourceBadge source={material.source} />
      </ProjectMaterialField>

      <ProjectMaterialField align="right" label={tCommon("actions")}>
        <Link
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 shadow-sm outline-none transition-colors hover:bg-frosted-blue-100 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-auto 2xl:h-9"
          href={`/dashboard/projects/${material.project.id}/quote`}
        >
          {tActions("openQuote")}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </ProjectMaterialField>
    </article>
  );
}

type ProjectMaterialFieldProps = {
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
  label: string;
};

function ProjectMaterialField({
  align = "left",
  children,
  className = "",
  label,
}: ProjectMaterialFieldProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55 2xl:hidden">
        {label}
      </span>
      <div className={`min-w-0 ${align === "right" ? "2xl:text-right" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: MaterialCategory }) {
  const tCategories = useTranslations("MaterialCategories");

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryStyles[category]}`}
    >
      <span className="truncate">{tCategories(category)}</span>
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const tMaterials = useTranslations("Materials");
  const sourceLabel =
    source === "manual"
      ? tMaterials("sources.manual")
      : source === "rule"
        ? tMaterials("sources.rule")
        : source;

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getSourceBadgeClassName(
        source,
      )}`}
    >
      <span className="truncate">{sourceLabel}</span>
    </span>
  );
}

function EmptyProjectMaterialsOverview() {
  const tActions = useTranslations("Actions");
  const tProjectMaterials = useTranslations("ProjectMaterials");

  return (
    <section className="rounded-lg border border-dashed border-frosted-blue-300 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
        <FilePenLine aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-deep-twilight-950">
        {tProjectMaterials("empty.title")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-deep-twilight-700">
        {tProjectMaterials("empty.description")}
      </p>
      <Link
        className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-auto"
        href="/dashboard/projects"
      >
        {tActions("viewProjects")}
      </Link>
    </section>
  );
}

function getSourceBadgeClassName(source: string): string {
  if (source === "manual") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (source === "rule") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-frosted-blue-200 bg-frosted-blue-50 text-deep-twilight-700";
}

function formatDecimal(value: string, locale: string): string {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return value;
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(numberValue);
}

function formatMoney(value: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency",
  }).format(Number(value));
}
