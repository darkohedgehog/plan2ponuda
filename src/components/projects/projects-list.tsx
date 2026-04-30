"use client";

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
  label: string;
  value: ProjectStatus | "all";
}> = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Uploaded", value: "uploaded" },
  { label: "Analyzing", value: "analyzing" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Quoted", value: "quoted" },
  { label: "Failed", value: "failed" },
];

export function ProjectsList({ projects }: ProjectsListProps) {
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
        <div className="grid gap-2 sm:grid-cols-[minmax(14rem,18rem)_12rem]">
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search projects or clients"
            type="search"
            value={searchQuery}
          />
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            onChange={(event) =>
              setSelectedStatus(event.target.value as ProjectStatus | "all")
            }
            value={selectedStatus}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <h3 className="text-base font-semibold text-slate-950">
            No projects match your filters
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Try a different search term or status filter.
          </p>
        </div>
      )}
    </section>
  );
}
