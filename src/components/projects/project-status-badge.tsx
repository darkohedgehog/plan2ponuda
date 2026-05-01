import type { ProjectStatus } from "@/types/project";

const statusStyles: Record<ProjectStatus, string> = {
  analyzing: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  quoted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  reviewed: "bg-blue-50 text-blue-700 ring-blue-200",
  uploaded: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

const statusDotStyles: Record<ProjectStatus, string> = {
  analyzing: "bg-amber-500",
  draft: "bg-slate-400",
  failed: "bg-red-500",
  quoted: "bg-emerald-500",
  reviewed: "bg-blue-500",
  uploaded: "bg-indigo-500",
};

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold capitalize leading-none ring-1 ring-inset ${statusStyles[status]}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${statusDotStyles[status]}`}
      />
      {status}
    </span>
  );
}
