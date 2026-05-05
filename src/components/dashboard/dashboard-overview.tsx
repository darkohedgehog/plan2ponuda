import { useLocale, useTranslations } from "next-intl";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Link } from "@/i18n/navigation";
import type { ProjectDashboardOverview } from "@/server/services/project-service";
import type { Project } from "@/types/project";

type DashboardOverviewProps = {
  overview: ProjectDashboardOverview;
  userName?: string | null;
};

const workflowStepKeys = [
  "createProject",
  "uploadPlan",
  "reviewRooms",
  "generateQuote",
] as const;

export function DashboardOverview({
  overview,
  userName,
}: DashboardOverviewProps) {
  const tActions = useTranslations("Actions");
  const tDashboard = useTranslations("Dashboard.home");
  const hasProjects = overview.recentProjects.length > 0;
  const displayName = userName?.trim() || tDashboard("fallbackName");

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-sm font-semibold text-blue-700">
              {tDashboard("hero.welcome", { name: displayName })}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {tDashboard("hero.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {tDashboard("hero.description")}
            </p>
          </div>
          <Link
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-fit"
            href="/dashboard/projects/new"
          >
            {tActions("createProject")}
          </Link>
        </div>
      </section>

      <section
        aria-label={tDashboard("stats.ariaLabel")}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatsCard
          label={tDashboard("stats.total")}
          value={overview.stats.totalProjects}
        />
        <StatsCard
          label={tDashboard("stats.draft")}
          value={overview.stats.draftProjects}
        />
        <StatsCard
          label={tDashboard("stats.reviewed")}
          value={overview.stats.reviewedProjects}
        />
        <StatsCard
          label={tDashboard("stats.quoted")}
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
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

type RecentProjectsProps = {
  projects: Project[];
};

function RecentProjects({ projects }: RecentProjectsProps) {
  const tActions = useTranslations("Actions");
  const tDashboard = useTranslations("Dashboard.home");

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {tDashboard("recentProjects.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {tDashboard("recentProjects.subtitle")}
          </p>
        </div>
        <Link
          className="rounded-md text-sm font-semibold text-blue-700 outline-none hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-100"
          href="/dashboard/projects"
        >
          {tActions("viewAllProjects")}
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
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tProjects = useTranslations("Projects");

  return (
    <article className="grid min-w-0 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1.5fr)_minmax(7rem,1fr)_0.8fr_auto] md:items-center">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-950">
          {project.name}
        </h3>
        <p className="mt-1 truncate text-sm text-slate-500">
          {project.clientName ?? tProjects("card.noClientAssigned")}
        </p>
      </div>
      <ProjectStatusBadge status={project.status} />
      <p className="text-sm text-slate-500">
        {formatDate(project.createdAt, locale)}
      </p>
      <Link
        className="inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-fit"
        href={`/dashboard/projects/${project.id}`}
      >
        {tActions("open")}
      </Link>
    </article>
  );
}

function EmptyProjectsState() {
  const tActions = useTranslations("Actions");
  const tDashboard = useTranslations("Dashboard.home");

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
        {tDashboard("emptyProjects.title")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {tDashboard("emptyProjects.description")}
      </p>
      <Link
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-fit"
        href="/dashboard/projects/new"
      >
        {tActions("createFirstProject")}
      </Link>
    </section>
  );
}

function WorkflowSection() {
  const tDashboard = useTranslations("Dashboard.home");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          {tDashboard("workflow.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {tDashboard("workflow.subtitle")}
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {workflowStepKeys.map((stepKey, index) => (
          <article
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={stepKey}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-semibold text-blue-700 ring-1 ring-slate-200">
              {index + 1}
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">
              {tDashboard(`workflow.steps.${stepKey}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {tDashboard(`workflow.steps.${stepKey}.description`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
