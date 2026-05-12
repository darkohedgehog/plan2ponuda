import {
  ClipboardList,
  FolderKanban,
  PackageCheck,
  PencilLine,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

import type { UserMaterialSummary } from "@/types/quote";

type MaterialSummaryCardsProps = {
  summary: UserMaterialSummary;
};

type SummaryCard = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  labelKey:
    | "manualLineCount"
    | "materialLineCount"
    | "projectCount"
    | "totalMaterialValue";
  value: string;
};

export function MaterialSummaryCards({ summary }: MaterialSummaryCardsProps) {
  const locale = useLocale();
  const tProjectMaterials = useTranslations("ProjectMaterials");
  const cards: SummaryCard[] = [
    {
      icon: PackageCheck,
      labelKey: "totalMaterialValue",
      value: formatMoney(summary.totalMaterialValue, locale),
    },
    {
      icon: FolderKanban,
      labelKey: "projectCount",
      value: formatInteger(summary.projectCount, locale),
    },
    {
      icon: ClipboardList,
      labelKey: "materialLineCount",
      value: formatInteger(summary.materialLineCount, locale),
    },
    {
      icon: PencilLine,
      labelKey: "manualLineCount",
      value: formatInteger(summary.manualLineCount, locale),
    },
  ];

  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            className="min-w-0 rounded-lg border border-frosted-blue-200 bg-white p-4 shadow-sm"
            key={card.labelKey}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55">
                  {tProjectMaterials(`summary.${card.labelKey}`)}
                </p>
                <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-deep-twilight-950">
                  {card.value}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMoney(value: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency",
  }).format(Number(value));
}
