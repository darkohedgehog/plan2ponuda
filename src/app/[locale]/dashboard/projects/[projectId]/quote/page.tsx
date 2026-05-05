import { notFound } from "next/navigation";

import { QuoteSummary } from "@/components/quote/quote-summary";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getProjectById } from "@/server/services/project-service";
import { getQuoteWorkspace } from "@/server/services/quote-service";

type ProjectQuotePageProps = {
  params: Promise<{
    locale: string;
    projectId: string;
  }>;
};

export default async function ProjectQuotePage({
  params,
}: ProjectQuotePageProps) {
  const { locale: rawLocale, projectId } = await params;
  const locale = resolveLocale(rawLocale);
  const parsedParams = projectIdSchema.safeParse({ projectId });

  if (!parsedParams.success) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const project = await getProjectById(parsedParams.data.projectId, user.id);

  if (!project) {
    notFound();
  }

  const quoteResult = await getQuoteWorkspace(project.id, user.id);

  if (!quoteResult.ok) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-4">
      <QuoteSummary
        areaM2={project.areaM2}
        exportHref={`/api/pdf/${project.id}`}
        materials={quoteResult.materials}
        projectName={project.name}
        quote={quoteResult.quote}
      />
    </main>
  );
}
