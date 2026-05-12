import { getTranslations } from "next-intl/server";

import { MaterialCatalog } from "@/components/materials/material-catalog";
import { MaterialSummaryCards } from "@/components/materials/material-summary-cards";
import { MaterialsDashboardTabs } from "@/components/materials/materials-dashboard-tabs";
import { ProjectMaterialsOverview } from "@/components/materials/project-materials-overview";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getMaterialCatalog,
  getUserMaterialSummary,
  getUserProjectMaterials,
} from "@/server/services/material-service";

type MaterialsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function MaterialsPage({ params }: MaterialsPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const [materials, projectMaterials, materialSummary] = await Promise.all([
    getMaterialCatalog(),
    getUserProjectMaterials(user.id),
    getUserMaterialSummary(user.id),
  ]);
  const tMaterials = await getTranslations("Materials");

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-bright-teal-blue-700">
          {tMaterials("page.eyebrow")}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-deep-twilight-950 sm:text-3xl">
          {tMaterials("page.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-deep-twilight-700">
          {tMaterials("page.description")}
        </p>
      </section>

      <MaterialSummaryCards summary={materialSummary} />

      <MaterialsDashboardTabs
        catalog={<MaterialCatalog materials={materials} />}
        catalogCount={materials.length}
        projectMaterialCount={projectMaterials.length}
        projectMaterials={
          <ProjectMaterialsOverview materials={projectMaterials} />
        }
      />
    </main>
  );
}
