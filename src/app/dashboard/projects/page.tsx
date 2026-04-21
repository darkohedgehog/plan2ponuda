import Link from "next/link";

import { ProjectCard } from "@/components/projects/project-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserProjects } from "@/server/services/project-service";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const projects = user ? await getUserProjects(user.id) : [];

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <Link
          className="text-sm font-medium text-blue-700"
          href="/dashboard/projects/new"
        >
          New project
        </Link>
      </div>
      {projects.length > 0 ? (
        <div className="grid gap-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-slate-600">No projects yet.</p>
          <Link
            className="mt-3 inline-flex text-sm font-medium text-blue-700"
            href="/dashboard/projects/new"
          >
            Create your first project
          </Link>
        </div>
      )}
    </main>
  );
}
