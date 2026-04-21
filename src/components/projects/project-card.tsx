import Link from "next/link";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
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
    <article className="grid gap-5 border-b border-slate-200 bg-white p-5 transition-colors last:border-b-0 hover:bg-slate-50/70 lg:grid-cols-[1.35fr_0.95fr_0.9fr_0.65fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="truncate text-base font-semibold text-slate-950">
            {project.name}
          </h3>
          <ProjectStatusBadge status={project.status} />
        </div>
        <p className="mt-2 truncate text-sm text-slate-500">
          {project.clientName ?? "No client assigned"}
        </p>
      </div>

      <MetadataItem label="Object type" value={formatObjectType(project.objectType)} />
      <MetadataItem label="Area" value={`${project.areaM2} m2`} />
      <MetadataItem label="Created" value={formatDate(project.createdAt)} />

      <Link
        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
        href={`/dashboard/projects/${project.id}`}
      >
        Open project
      </Link>
    </article>
  );
}

type MetadataItemProps = {
  label: string;
  value: string;
};

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function formatObjectType(value: Project["objectType"]): string {
  const objectTypeLabels: Record<Project["objectType"], string> = {
    apartment: "Apartment",
    house: "House",
    office: "Office",
  };

  return objectTypeLabels[value];
}
