import Link from "next/link";

import type { Project } from "@/types/project";

type ProjectCardProps = {
  project: Project;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">{project.name}</h3>
          <dl className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="sr-only">Client</dt>
              <dd>{project.clientName ?? "No client"}</dd>
            </div>
            <div>
              <dt className="sr-only">Object type</dt>
              <dd>{project.objectType}</dd>
            </div>
            <div>
              <dt className="sr-only">Area</dt>
              <dd>{project.areaM2} m2</dd>
            </div>
            <div>
              <dt className="sr-only">Created</dt>
              <dd>{formatDate(project.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {project.status}
          </span>
          <Link
            className="text-sm font-medium text-blue-700"
            href={`/dashboard/projects/${project.id}`}
          >
            Open project
          </Link>
        </div>
      </div>
    </article>
  );
}
