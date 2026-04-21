import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectCard } from "@/components/projects/project-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserProjects } from "@/server/services/project-service";

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const projects = await getUserProjects(user.id);
  const hasProjects = projects.length > 0;

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-700">
              Project management
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Projects
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track every floor-plan estimate from project setup through room
              review, material planning, and quote export.
            </p>
          </div>
          <Link
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
            href="/dashboard/projects/new"
          >
            New Project
          </Link>
        </div>
      </section>

      {hasProjects ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                All projects
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Newest projects are shown first.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Search coming soon
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Status filters coming soon
              </div>
            </div>
          </div>
          <div>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyProjectsState />
      )}
    </main>
  );
}

function EmptyProjectsState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-950">
        No projects yet
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Create your first project to upload a floor plan, review detected rooms,
        and prepare an electrical installation quote.
      </p>
      <div className="mt-6">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
          href="/dashboard/projects/new"
        >
          Create your first project
        </Link>
      </div>
    </section>
  );
}
