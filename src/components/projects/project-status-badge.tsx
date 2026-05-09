import { useTranslations } from "next-intl";

import type { ProjectStatus } from "@/types/project";

const statusStyles: Record<ProjectStatus, string> = {
  analyzing: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-frosted-blue-100 text-deep-twilight-800 ring-frosted-blue-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  quoted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  reviewed: "bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-bright-teal-blue-200",
  uploaded: "bg-turquoise-surf-50 text-turquoise-surf-800 ring-turquoise-surf-200",
};

const statusDotStyles: Record<ProjectStatus, string> = {
  analyzing: "bg-amber-500",
  draft: "bg-frosted-blue-500",
  failed: "bg-red-500",
  quoted: "bg-emerald-500",
  reviewed: "bg-bright-teal-blue-500",
  uploaded: "bg-turquoise-surf-500",
};

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const tStatus = useTranslations("Status.project");

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold leading-none ring-1 ring-inset ${statusStyles[status]}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${statusDotStyles[status]}`}
      />
      {tStatus(status)}
    </span>
  );
}
