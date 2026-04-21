import { notFound, redirect } from "next/navigation";

import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectById } from "@/server/services/project-service";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const project = await getProjectById(projectId, user.id);

  if (!project) {
    notFound();
  }

  return <ProjectWorkspace project={project} />;
}
