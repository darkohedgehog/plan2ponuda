"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

type MaterialsDashboardTabsProps = {
  catalog: ReactNode;
  catalogCount: number;
  projectMaterialCount: number;
  projectMaterials: ReactNode;
};

type MaterialsTabKey = "catalog" | "projectMaterials";

type MaterialsTab = {
  count: number;
  key: MaterialsTabKey;
};

const tabs: MaterialsTab[] = [
  {
    count: 0,
    key: "catalog",
  },
  {
    count: 0,
    key: "projectMaterials",
  },
];

export function MaterialsDashboardTabs({
  catalog,
  catalogCount,
  projectMaterialCount,
  projectMaterials,
}: MaterialsDashboardTabsProps) {
  const tMaterials = useTranslations("Materials");
  const [activeTab, setActiveTab] = useState<MaterialsTabKey>("catalog");
  const tabsWithCounts: MaterialsTab[] = tabs.map((tab) => ({
    ...tab,
    count: tab.key === "catalog" ? catalogCount : projectMaterialCount,
  }));

  return (
    <section className="min-w-0">
      <div
        aria-label={tMaterials("tabs.ariaLabel")}
        className="grid gap-2 rounded-lg border border-frosted-blue-200 bg-white p-2 shadow-sm sm:inline-grid sm:grid-cols-2"
        role="tablist"
      >
        {tabsWithCounts.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              aria-controls={`materials-tab-panel-${tab.key}`}
              aria-selected={isActive}
              className={`inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-deep-twilight-600 text-white shadow-sm"
                  : "bg-white text-deep-twilight-700 hover:bg-frosted-blue-50 hover:text-deep-twilight-950"
              }`}
              id={`materials-tab-${tab.key}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              type="button"
            >
              <span className="truncate">{tMaterials(`tabs.${tab.key}`)}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-frosted-blue-100 text-deep-twilight-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby="materials-tab-catalog"
        className="mt-4"
        hidden={activeTab !== "catalog"}
        id="materials-tab-panel-catalog"
        role="tabpanel"
      >
        {catalog}
      </div>
      <div
        aria-labelledby="materials-tab-projectMaterials"
        className="mt-4"
        hidden={activeTab !== "projectMaterials"}
        id="materials-tab-panel-projectMaterials"
        role="tabpanel"
      >
        {projectMaterials}
      </div>
    </section>
  );
}
