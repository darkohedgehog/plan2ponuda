import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Link } from "@/i18n/navigation";
import type { Project } from "@/types/project";

export type ProjectCardProject = Omit<Project, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ProjectCardProps = {
  project: ProjectCardProject;
};

function formatDate(date: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function ProjectCard({ project }: ProjectCardProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tCommon = useTranslations("Common");
  const tProjects = useTranslations("Projects");

  return (
    <article className="grid min-w-0 gap-4 bg-white p-4 transition-colors hover:bg-slate-50/70 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(8rem,0.95fr)_minmax(6rem,0.7fr)_minmax(7rem,0.65fr)_auto] lg:items-center lg:gap-5">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
          <h3 className="min-w-0 truncate text-base font-semibold text-slate-950">
            {project.name}
          </h3>
          <ProjectStatusBadge status={project.status} />
        </div>
        <p className="mt-2 truncate text-sm text-slate-500">
          {project.clientName ?? tProjects("card.noClientAssigned")}
        </p>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:contents">
        <MetadataItem
          label={tCommon("objectType")}
          value={tProjects(`objectTypes.${project.objectType}`)}
        />
        <MetadataItem label={tCommon("area")} value={`${project.areaM2} m2`} />
        <MetadataItem
          label={tCommon("created")}
          value={formatDate(project.createdAt, locale)}
        />
      </div>

      <Link
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-fit lg:justify-self-end"
        href={`/dashboard/projects/${project.id}`}
      >
        {tActions("openProject")}
      </Link>
    </article>
  );
}

type MetadataItemProps = {
  label: string;
  value: ReactNode;
};

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <div className="min-w-0 rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-100 lg:bg-transparent lg:p-0 lg:ring-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}
