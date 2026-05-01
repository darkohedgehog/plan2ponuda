import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectsList } from "@/components/projects/projects-list";
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
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-sm font-semibold text-blue-700">
              Project management
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Projects
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track every floor-plan estimate from project setup through room
              review, material planning, and quote export.
            </p>
          </div>
          <Link
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-fit"
            href="/dashboard/projects/new"
          >
            New Project
          </Link>
        </div>
      </section>

      {hasProjects ? (
        <ProjectsList
          projects={projects.map((project) => ({
            ...project,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          }))}
        />
      ) : (
        <EmptyProjectsState />
      )}
    </main>
  );
}

function EmptyProjectsState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
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
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-fit"
          href="/dashboard/projects/new"
        >
          Create your first project
        </Link>
      </div>
    </section>
  );
}
