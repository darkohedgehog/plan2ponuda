"use client";

import { CircleX, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  ProjectCard,
  type ProjectCardProject,
} from "@/components/projects/project-card";
import type { ProjectStatus } from "@/types/project";

type ProjectsListProps = {
  projects: ProjectCardProject[];
};

const statusOptions: Array<{
  value: ProjectStatus | "all";
}> = [
  { value: "all" },
  { value: "draft" },
  { value: "uploaded" },
  { value: "analyzing" },
  { value: "reviewed" },
  { value: "quoted" },
  { value: "failed" },
];

export function ProjectsList({ projects }: ProjectsListProps) {
  const tDashboard = useTranslations("Dashboard");
  const tEmptyState = useTranslations("EmptyStates.projects.noMatches");
  const tProjects = useTranslations("Projects");
  const tStatus = useTranslations("Status.project");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">(
    "all",
  );
  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        selectedStatus === "all" || project.status === selectedStatus;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        (project.clientName ?? "").toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesSearch;
    });
  }, [projects, searchQuery, selectedStatus]);

  return (
    <section className="overflow-hidden rounded-lg border border-frosted-blue-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-frosted-blue-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-deep-twilight-950">
            {tProjects("list.title")}
          </h2>
          <p className="mt-1 text-sm text-deep-twilight-700/70">
            {tProjects("list.subtitle")}
          </p>
        </div>
        <div className="grid w-full min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] lg:max-w-xl">
          <div className="relative min-w-0">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-twilight-700/45"
            />
            <input
              aria-label={tProjects("list.searchAriaLabel")}
              className="h-10 w-full min-w-0 rounded-md border border-frosted-blue-300 bg-white pl-9 pr-3 text-sm font-medium text-deep-twilight-950 outline-none transition-colors placeholder:text-deep-twilight-700/45 focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={tProjects("list.searchPlaceholder")}
              type="search"
              value={searchQuery}
            />
          </div>
          <select
            aria-label={tProjects("list.statusFilterAriaLabel")}
            className="h-10 min-w-0 rounded-md border border-frosted-blue-300 bg-white px-3 text-sm font-medium text-deep-twilight-950 outline-none transition-colors focus:border-bright-teal-blue-500 focus:ring-2 focus:ring-bright-teal-blue-100"
            onChange={(event) =>
              setSelectedStatus(event.target.value as ProjectStatus | "all")
            }
            value={selectedStatus}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "all"
                  ? tDashboard("allStatuses")
                  : tStatus(option.value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="divide-y divide-frosted-blue-200">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <CircleX aria-hidden="true" className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-deep-twilight-950">
            {tEmptyState("title")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-deep-twilight-700">
            {tEmptyState("description")}
          </p>
        </div>
      )}
    </section>
  );
}
