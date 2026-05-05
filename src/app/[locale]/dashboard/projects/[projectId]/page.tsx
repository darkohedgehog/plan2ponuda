import { notFound } from "next/navigation";

import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectWorkspaceData } from "@/server/services/project-service";

type ProjectPageProps = {
  params: Promise<{
    locale: string;
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale: rawLocale, projectId } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const project = await getProjectWorkspaceData(projectId, user.id);

  if (!project) {
    notFound();
  }

  return <ProjectWorkspace project={project} />;
}
