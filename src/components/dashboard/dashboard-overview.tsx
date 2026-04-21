import Link from "next/link";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import type { ProjectDashboardOverview } from "@/server/services/project-service";
import type { Project } from "@/types/project";

type DashboardOverviewProps = {
  overview: ProjectDashboardOverview;
  userName?: string | null;
};

const workflowSteps = [
  {
    title: "Create project",
    description: "Add client details and basic project information.",
  },
  {
    title: "Upload plan",
    description: "Attach the PDF or image floor plan for the installation.",
  },
  {
    title: "Review rooms",
    description: "Check detected spaces and tune room-level suggestions.",
  },
  {
    title: "Generate quote",
    description: "Build materials, labor, and a client-ready estimate.",
  },
];

export function DashboardOverview({
  overview,
  userName,
}: DashboardOverviewProps) {
  const hasProjects = overview.recentProjects.length > 0;
  const displayName = userName?.trim() || "there";

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-700">
              Welcome back, {displayName}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Turn floor plans into electrical quotes with a guided workflow.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Start a project, upload a plan, review detected rooms, and move the
              estimate toward a client-ready quote.
            </p>
          </div>
          <Link
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
            href="/dashboard/projects/new"
          >
            Create Project
          </Link>
        </div>
      </section>

      <section
        aria-label="Project statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatsCard
          label="Total projects"
          value={overview.stats.totalProjects}
        />
        <StatsCard
          label="Draft projects"
          value={overview.stats.draftProjects}
        />
        <StatsCard
          label="Reviewed projects"
          value={overview.stats.reviewedProjects}
        />
        <StatsCard
          label="Quoted projects"
          value={overview.stats.quotedProjects}
        />
      </section>

      {hasProjects ? (
        <RecentProjects projects={overview.recentProjects} />
      ) : (
        <EmptyProjectsState />
      )}

      <WorkflowSection />
    </main>
  );
}

type StatsCardProps = {
  label: string;
  value: number;
};

function StatsCard({ label, value }: StatsCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

type RecentProjectsProps = {
  projects: Project[];
};

function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Recent projects
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Continue from your latest floor plan estimates.
          </p>
        </div>
        <Link
          className="rounded-md text-sm font-semibold text-blue-700 outline-none hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-100"
          href="/dashboard/projects"
        >
          View all projects
        </Link>
      </div>

      <div className="divide-y divide-slate-200">
        {projects.map((project) => (
          <RecentProjectRow key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

type RecentProjectRowProps = {
  project: Project;
};

function RecentProjectRow({ project }: RecentProjectRowProps) {
  return (
    <article className="grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_0.8fr_auto] md:items-center">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-950">
          {project.name}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {project.clientName ?? "No client assigned"}
        </p>
      </div>
      <ProjectStatusBadge status={project.status} />
      <p className="text-sm text-slate-500">{formatDate(project.createdAt)}</p>
      <Link
        className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
        href={`/dashboard/projects/${project.id}`}
      >
        Open
      </Link>
    </article>
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
        Create your first project
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Start with a project record, then upload the floor plan and move through
        review, materials, and quote generation.
      </p>
      <Link
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
        href="/dashboard/projects/new"
      >
        Create first project
      </Link>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Quote workflow
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          The main path from a new client plan to a structured offer.
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {workflowSteps.map((step, index) => (
          <article
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={step.title}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-semibold text-blue-700 ring-1 ring-slate-200">
              {index + 1}
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
