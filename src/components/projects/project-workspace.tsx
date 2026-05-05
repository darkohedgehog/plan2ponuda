import { useLocale, useTranslations } from "next-intl";

import { FloorPlanUploadForm } from "@/components/projects/floor-plan-upload-form";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Link } from "@/i18n/navigation";
import type { Project, ProjectStatus } from "@/types/project";

type ProjectWorkspaceProps = {
  project: ProjectWorkspaceProject;
};

type ProjectWorkspaceProject = Project & {
  hasMaterials: boolean;
  hasQuote: boolean;
  hasRooms: boolean;
};

type WorkflowStepState = "not started" | "in progress" | "ready";
type WorkflowStepKey =
  | "electricalSuggestions"
  | "materials"
  | "quote"
  | "reviewRooms"
  | "uploadFloorPlan";
type ProjectWorkspaceActionKey =
  | "checkProject"
  | "generate"
  | "generateQuote"
  | "openQuote"
  | "openReview"
  | "replaceFile"
  | "review"
  | "reviewRooms"
  | "upload"
  | "uploadFloorPlan"
  | "waiting";
type NextStepKey =
  | "analysisInProgress"
  | "attentionRequired"
  | "floorPlanRequired"
  | "materialsAndQuote"
  | "quoteAvailable"
  | "reviewRooms";

type WorkflowStep = {
  actionHref?: string;
  actionLabelKey: ProjectWorkspaceActionKey;
  stepKey: WorkflowStepKey;
  state: WorkflowStepState;
};

const workflowStateLabelKeys: Record<
  WorkflowStepState,
  "inProgress" | "notStarted" | "ready"
> = {
  "in progress": "inProgress",
  "not started": "notStarted",
  ready: "ready",
};

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tCommon = useTranslations("Common");
  const tProjects = useTranslations("Projects");
  const tUpload = useTranslations("Upload");
  const tWorkspace = useTranslations("ProjectWorkspace");
  const workflowSteps = getWorkflowSteps(project);
  const nextStep = getNextStep(project);

  return (
    <main className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <ProjectStatusBadge status={project.status} />
              <p className="text-sm font-medium text-slate-500">
                {tWorkspace("meta.created", {
                  date: formatDate(project.createdAt, locale),
                })}
              </p>
            </div>

            <h2 className="mt-4 wrap-break-word text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {project.name}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {tWorkspace("hero.description")}
            </p>
          </div>

          <Link
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href={nextStep.href}
          >
            {tActions(nextStep.labelKey)}
          </Link>
        </div>

        <dl className="mt-6 grid min-w-0 gap-3 border-t border-slate-200 pt-6 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem
            label={tCommon("client")}
            value={project.clientName ?? tCommon("notSet")}
          />
          <SummaryItem
            label={tCommon("objectType")}
            value={tProjects(`objectTypes.${project.objectType}`)}
          />
          <SummaryItem label={tCommon("area")} value={`${project.areaM2} m²`} />
          <SummaryItem
            label={tCommon("floorPlan")}
            value={
              project.sourceFilePath
                ? tCommon("uploaded")
                : tCommon("notUploaded")
            }
          />
        </dl>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {tWorkspace("workflow.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tWorkspace("workflow.subtitle")}
            </p>
          </div>

          <div className="mt-5 grid min-w-0 gap-3">
            {workflowSteps.map((step, index) => (
              <WorkflowStepCard index={index} key={step.stepKey} step={step} />
            ))}
          </div>
        </div>

        <div
          className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          id="floor-plan-upload"
        >
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950">
              {tUpload("floorPlan.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {project.sourceFilePath
                ? tUpload("floorPlan.attachedDescription")
                : tUpload("floorPlan.emptyDescription")}
            </p>
          </div>

          {project.sourceFilePath ? (
            <div className="mt-4 min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {tUpload("floorPlan.uploadedFile")}
              </p>
              <p className="mt-1 break-all text-sm font-medium text-slate-700">
                {project.sourceFilePath}
              </p>
            </div>
          ) : null}

          <div className="mt-4 min-w-0">
            <FloorPlanUploadForm projectId={project.id} />
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950">
              {tWorkspace("currentNextStep.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {tWorkspace(`nextSteps.${nextStep.descriptionKey}.description`)}
            </p>
          </div>

          <Link
            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 md:w-auto"
            href={nextStep.href}
          >
            {tActions(nextStep.labelKey)}
          </Link>
        </div>
      </section>
    </main>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-2 wrap-break-word text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

type WorkflowStepCardProps = {
  index: number;
  step: WorkflowStep;
};

function WorkflowStepCard({ index, step }: WorkflowStepCardProps) {
  const tActions = useTranslations("Actions");
  const tWorkspace = useTranslations("ProjectWorkspace");

  return (
    <article className="grid min-w-0 gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold text-blue-700 ring-1 ring-slate-200">
        {index + 1}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="wrap-break-word text-sm font-semibold text-slate-950">
            {tWorkspace(`workflow.steps.${step.stepKey}.title`)}
          </h3>
          <WorkflowStateBadge state={step.state} />
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {tWorkspace(`workflow.steps.${step.stepKey}.description`)}
        </p>
      </div>

      <div className="md:col-span-2 lg:col-span-1 lg:justify-self-end">
        {step.actionHref ? (
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href={step.actionHref}
          >
            {tActions(step.actionLabelKey)}
          </Link>
        ) : (
          <span className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400 sm:w-auto">
            {tActions(step.actionLabelKey)}
          </span>
        )}
      </div>
    </article>
  );
}

type WorkflowStateBadgeProps = {
  state: WorkflowStepState;
};

function WorkflowStateBadge({ state }: WorkflowStateBadgeProps) {
  const tWorkspace = useTranslations("ProjectWorkspace");
  const stateStyles: Record<WorkflowStepState, string> = {
    "in progress": "bg-amber-50 text-amber-700 ring-amber-200",
    "not started": "bg-slate-100 text-slate-600 ring-slate-200",
    ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${stateStyles[state]}`}
    >
      {tWorkspace(`workflow.states.${workflowStateLabelKeys[state]}`)}
    </span>
  );
}

type NextStep = {
  descriptionKey: NextStepKey;
  href: string;
  labelKey: ProjectWorkspaceActionKey;
};

function getNextStep(project: ProjectWorkspaceProject): NextStep {
  if (project.hasQuote) {
    return {
      descriptionKey: "quoteAvailable",
      href: `/dashboard/projects/${project.id}/quote`,
      labelKey: "openQuote",
    };
  }

  if (!project.sourceFilePath) {
    return {
      descriptionKey: "floorPlanRequired",
      href: "#floor-plan-upload",
      labelKey: "uploadFloorPlan",
    };
  }

  if (project.status === "draft" || project.status === "uploaded") {
    return {
      descriptionKey: "reviewRooms",
      href: `/dashboard/projects/${project.id}/review`,
      labelKey: "reviewRooms",
    };
  }

  if (project.status === "analyzing") {
    return {
      descriptionKey: "analysisInProgress",
      href: `/dashboard/projects/${project.id}/review`,
      labelKey: "openReview",
    };
  }

  if (project.status === "reviewed") {
    return {
      descriptionKey: "materialsAndQuote",
      href: `/dashboard/projects/${project.id}/quote`,
      labelKey: "generateQuote",
    };
  }

  if (project.status === "quoted") {
    return {
      descriptionKey: "quoteAvailable",
      href: `/dashboard/projects/${project.id}/quote`,
      labelKey: "openQuote",
    };
  }

  return {
    descriptionKey: "attentionRequired",
    href: "#floor-plan-upload",
    labelKey: "checkProject",
  };
}

function getWorkflowSteps(project: ProjectWorkspaceProject): WorkflowStep[] {
  const hasFloorPlan = Boolean(project.sourceFilePath);
  const roomsReviewed = isAtLeastStatus(project.status, "reviewed");
  const hasPersistedMaterials = project.hasMaterials;
  const quoteReady = project.hasQuote;

  return [
    {
      actionHref: "#floor-plan-upload",
      actionLabelKey: hasFloorPlan ? "replaceFile" : "upload",
      stepKey: "uploadFloorPlan",
      state: hasFloorPlan ? "ready" : "in progress",
    },
    {
      actionHref: hasFloorPlan
        ? `/dashboard/projects/${project.id}/review`
        : undefined,
      actionLabelKey: hasFloorPlan ? "review" : "waiting",
      stepKey: "reviewRooms",
      state: roomsReviewed ? "ready" : hasFloorPlan ? "in progress" : "not started",
    },
    {
      actionHref: hasFloorPlan
        ? `/dashboard/projects/${project.id}/review`
        : undefined,
      actionLabelKey: hasFloorPlan ? "openReview" : "waiting",
      stepKey: "electricalSuggestions",
      state: roomsReviewed ? "ready" : "not started",
    },
    {
      actionHref: roomsReviewed
        ? `/dashboard/projects/${project.id}/quote`
        : undefined,
      actionLabelKey: roomsReviewed ? "openQuote" : "waiting",
      stepKey: "materials",
      state: hasPersistedMaterials
        ? "ready"
        : roomsReviewed
          ? "in progress"
          : "not started",
    },
    {
      actionHref: roomsReviewed
        ? `/dashboard/projects/${project.id}/quote`
        : undefined,
      actionLabelKey: quoteReady ? "openQuote" : roomsReviewed ? "generate" : "waiting",
      stepKey: "quote",
      state: quoteReady ? "ready" : roomsReviewed ? "in progress" : "not started",
    },
  ];
}

function isAtLeastStatus(
  currentStatus: ProjectStatus,
  targetStatus: "reviewed",
): boolean {
  const statusOrder: Record<ProjectStatus, number> = {
    analyzing: 2,
    draft: 0,
    failed: 0,
    quoted: 4,
    reviewed: 3,
    uploaded: 1,
  };
  const targetOrder: Record<typeof targetStatus, number> = {
    reviewed: 3,
  };

  return statusOrder[currentStatus] >= targetOrder[targetStatus];
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
