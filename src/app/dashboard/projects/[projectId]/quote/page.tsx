import { notFound, redirect } from "next/navigation";

import { QuoteSummary } from "@/components/quote/quote-summary";
import { getCurrentUser } from "@/lib/auth/session";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getProjectById } from "@/server/services/project-service";
import { generateProjectMaterialList } from "@/server/services/quote-service";

type ProjectQuotePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectQuotePage({
  params,
}: ProjectQuotePageProps) {
  const parsedParams = projectIdSchema.safeParse(await params);

  if (!parsedParams.success) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const project = await getProjectById(parsedParams.data.projectId, user.id);

  if (!project) {
    notFound();
  }

  const materialsResult = await generateProjectMaterialList(project.id, user.id);

  if (!materialsResult.ok) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-4">
      <QuoteSummary
        materials={materialsResult.materials}
        projectName={project.name}
      />
    </main>
  );
}
