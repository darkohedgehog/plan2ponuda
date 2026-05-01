import Link from "next/link";

import { FloorPlanUploadForm } from "@/components/projects/floor-plan-upload-form";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
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

type WorkflowStep = {
  actionHref?: string;
  actionLabel: string;
  description: string;
  state: WorkflowStepState;
  title: string;
};

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
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
                Created {formatDate(project.createdAt)}
              </p>
            </div>

            <h2 className="mt-4 wrap-break-word text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {project.name}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage this project from floor plan upload through review,
              material planning, and quote generation.
            </p>
          </div>

          <Link
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href={nextStep.href}
          >
            {nextStep.label}
          </Link>
        </div>

        <dl className="mt-6 grid min-w-0 gap-3 border-t border-slate-200 pt-6 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem label="Client" value={project.clientName ?? "Not set"} />
          <SummaryItem
            label="Object type"
            value={formatObjectType(project.objectType)}
          />
          <SummaryItem label="Area" value={`${project.areaM2} m²`} />
          <SummaryItem
            label="Floor plan"
            value={project.sourceFilePath ? "Uploaded" : "Not uploaded"}
          />
        </dl>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Workflow</h2>
            <p className="mt-1 text-sm text-slate-500">
              Follow the project lifecycle one step at a time.
            </p>
          </div>

          <div className="mt-5 grid min-w-0 gap-3">
            {workflowSteps.map((step, index) => (
              <WorkflowStepCard index={index} key={step.title} step={step} />
            ))}
          </div>
        </div>

        <div
          className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          id="floor-plan-upload"
        >
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950">
              Floor plan
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {project.sourceFilePath
                ? "A floor plan is attached. Uploading another file will replace the current project floor plan."
                : "Upload a PDF, PNG, JPG, or JPEG file up to 10MB to start the analysis workflow."}
            </p>
          </div>

          {project.sourceFilePath ? (
            <div className="mt-4 min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Uploaded file
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
              Current next step
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {nextStep.description}
            </p>
          </div>

          <Link
            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 md:w-auto"
            href={nextStep.href}
          >
            {nextStep.label}
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
  return (
    <article className="grid min-w-0 gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold text-blue-700 ring-1 ring-slate-200">
        {index + 1}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="wrap-break-word text-sm font-semibold text-slate-950">
            {step.title}
          </h3>
          <WorkflowStateBadge state={step.state} />
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {step.description}
        </p>
      </div>

      <div className="md:col-span-2 lg:col-span-1 lg:justify-self-end">
        {step.actionHref ? (
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href={step.actionHref}
          >
            {step.actionLabel}
          </Link>
        ) : (
          <span className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400 sm:w-auto">
            {step.actionLabel}
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
  const stateStyles: Record<WorkflowStepState, string> = {
    "in progress": "bg-amber-50 text-amber-700 ring-amber-200",
    "not started": "bg-slate-100 text-slate-600 ring-slate-200",
    ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${stateStyles[state]}`}
    >
      {state}
    </span>
  );
}

type NextStep = {
  description: string;
  href: string;
  label: string;
};

function getNextStep(project: ProjectWorkspaceProject): NextStep {
  if (project.hasQuote) {
    return {
      description:
        "A quote is available for this project. Review quote details or continue refining the estimate.",
      href: `/dashboard/projects/${project.id}/quote`,
      label: "Open Quote",
    };
  }

  if (!project.sourceFilePath) {
    return {
      description:
        "Upload the project floor plan before room review, suggestions, materials, or quote generation can begin.",
      href: "#floor-plan-upload",
      label: "Upload Floor Plan",
    };
  }

  if (project.status === "draft" || project.status === "uploaded") {
    return {
      description:
        "Review detected rooms and prepare the electrical suggestion baseline for this project.",
      href: `/dashboard/projects/${project.id}/review`,
      label: "Review Rooms",
    };
  }

  if (project.status === "analyzing") {
    return {
      description:
        "Analysis is in progress. You can open the review workspace when room results are ready.",
      href: `/dashboard/projects/${project.id}/review`,
      label: "Open Review",
    };
  }

  if (project.status === "reviewed") {
    return {
      description:
        "Rooms have been reviewed. Continue to material calculation and quote preparation.",
      href: `/dashboard/projects/${project.id}/quote`,
      label: "Generate Quote",
    };
  }

  if (project.status === "quoted") {
    return {
      description:
        "A quote is available for this project. Review quote details or continue refining the estimate.",
      href: `/dashboard/projects/${project.id}/quote`,
      label: "Open Quote",
    };
  }

  return {
    description:
      "This project needs attention before the workflow can continue. Check the floor plan and review steps.",
    href: "#floor-plan-upload",
    label: "Check Project",
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
      actionLabel: hasFloorPlan ? "Replace file" : "Upload",
      description:
        "Attach the source PDF or image that the rest of the workflow depends on.",
      state: hasFloorPlan ? "ready" : "in progress",
      title: "Upload Floor Plan",
    },
    {
      actionHref: hasFloorPlan
        ? `/dashboard/projects/${project.id}/review`
        : undefined,
      actionLabel: hasFloorPlan ? "Review" : "Waiting",
      description:
        "Confirm detected rooms and correct the project structure before estimating.",
      state: roomsReviewed ? "ready" : hasFloorPlan ? "in progress" : "not started",
      title: "Review Rooms",
    },
    {
      actionHref: hasFloorPlan
        ? `/dashboard/projects/${project.id}/review`
        : undefined,
      actionLabel: hasFloorPlan ? "Open review" : "Waiting",
      description:
        "Use room types to prepare editable sockets, switches, and lighting suggestions.",
      state: roomsReviewed ? "ready" : "not started",
      title: "Electrical Suggestions",
    },
    {
      actionHref: roomsReviewed
        ? `/dashboard/projects/${project.id}/quote`
        : undefined,
      actionLabel: roomsReviewed ? "Open quote" : "Waiting",
      description:
        "Convert reviewed suggestions into material quantities and pricing inputs.",
      state: hasPersistedMaterials
        ? "ready"
        : roomsReviewed
          ? "in progress"
          : "not started",
      title: "Materials",
    },
    {
      actionHref: roomsReviewed
        ? `/dashboard/projects/${project.id}/quote`
        : undefined,
      actionLabel: quoteReady ? "Open quote" : roomsReviewed ? "Generate" : "Waiting",
      description:
        "Prepare the client-facing installation quote from project and material data.",
      state: quoteReady ? "ready" : roomsReviewed ? "in progress" : "not started",
      title: "Quote",
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatObjectType(value: Project["objectType"]): string {
  const objectTypeLabels: Record<Project["objectType"], string> = {
    apartment: "Apartment",
    house: "House",
    office: "Office",
  };

  return objectTypeLabels[value];
}
