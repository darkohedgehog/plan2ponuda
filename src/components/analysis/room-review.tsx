import { useTranslations } from "next-intl";

import { getRoomReviewEditorStateKey } from "@/components/analysis/analyze-floor-plan-state";
import { AnalyzeFloorPlanButton } from "@/components/analysis/analyze-floor-plan-button";
import { RoomReviewEditor } from "@/components/analysis/room-review-editor";
import type { FloorPlanPreview, Project } from "@/types/project";
import type { RoomReviewItem } from "@/types/room";

type ReviewProject = Pick<Project, "id" | "name" | "status">;

type RoomReviewProps = {
  floorPlanPreview: FloorPlanPreview;
  project: ReviewProject;
  rooms: RoomReviewItem[];
};

export function RoomReview({
  floorPlanPreview,
  project,
  rooms,
}: RoomReviewProps) {
  const tReview = useTranslations("Review");

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-bright-teal-blue-700">
          {tReview("hero.eyebrow")}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-deep-twilight-950 sm:text-3xl">
          {project.name}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-deep-twilight-700">
          {tReview("hero.description")}
        </p>
      </section>

      <section className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <FloorPlanCard
          hasExistingRooms={rooms.length > 0}
          preview={floorPlanPreview}
          project={project}
        />
        <RoomReviewEditor
          initialRooms={rooms}
          key={getRoomReviewEditorStateKey(project.id, rooms)}
          projectId={project.id}
        />
      </section>
    </main>
  );
}

type FloorPlanCardProps = {
  hasExistingRooms: boolean;
  preview: FloorPlanPreview;
  project: ReviewProject;
};

function FloorPlanCard({
  hasExistingRooms,
  preview,
  project,
}: FloorPlanCardProps) {
  const tReview = useTranslations("Review");
  const tStatus = useTranslations("Status.project");
  const hasFloorPlan =
    preview.kind !== "unavailable" || preview.reason !== "missing_file";

  return (
    <section className="min-w-0 rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-deep-twilight-950">
          {tReview("floorPlan.title")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-deep-twilight-700">
          {tReview("floorPlan.description")}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-frosted-blue-200 bg-frosted-blue-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-deep-twilight-700/55">
              {tReview("floorPlan.status.title")}
            </p>
            <p className="mt-2 text-sm font-semibold text-deep-twilight-800">
              {hasFloorPlan
                ? tReview("floorPlan.status.uploaded")
                : tReview("floorPlan.status.missing")}
            </p>
          </div>
          <span
            className={`m-5 inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
              hasFloorPlan
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-frosted-blue-100 text-deep-twilight-700 ring-frosted-blue-200"
            }`}
          >
            {tStatus(project.status)}
          </span>
        </div>

        <FloorPlanPreviewContent preview={preview} />
      </div>

      <AnalyzeFloorPlanButton
        hasExistingRooms={hasExistingRooms}
        hasFloorPlan={hasFloorPlan}
        key={`${project.id}-${
          hasExistingRooms ? "with-existing-rooms" : "without-existing-rooms"
        }`}
        projectId={project.id}
      />
    </section>
  );
}

type FloorPlanPreviewContentProps = {
  preview: FloorPlanPreview;
};

function FloorPlanPreviewContent({ preview }: FloorPlanPreviewContentProps) {
  const tReview = useTranslations("Review");

  if (preview.kind === "image") {
    return (
      <div className="border-t border-frosted-blue-200 bg-white p-4">
        {/* Native img keeps short-lived signed Supabase URLs out of Next image config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={tReview("floorPlan.preview.alt", {
            fileName: preview.fileName,
          })}
          className="max-h-140 w-full rounded-md border border-frosted-blue-200 object-contain"
          src={preview.url}
        />
      </div>
    );
  }

  if (preview.kind === "pdf") {
    return (
      <div className="border-t border-frosted-blue-200 bg-white p-5">
        <div className="rounded-md border border-frosted-blue-200 bg-frosted-blue-50 p-4">
          <p className="text-sm font-semibold text-deep-twilight-950">
            {tReview("floorPlan.preview.pdfTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
            {tReview("floorPlan.preview.pdfDescription")}
          </p>
          <a
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 shadow-sm outline-none transition-colors hover:bg-frosted-blue-100 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href={preview.url}
            rel="noreferrer"
            target="_blank"
          >
            {tReview("floorPlan.preview.openPdfPreview")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-frosted-blue-200 bg-white p-5">
      <div className="rounded-md border border-dashed border-frosted-blue-300 bg-frosted-blue-50 p-4">
        <p className="text-sm font-semibold text-deep-twilight-950">
          {tReview("floorPlan.preview.unavailable.title")}
        </p>
        <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
          {tReview(
            `floorPlan.preview.unavailable.${getPreviewUnavailableMessageKey(
              preview,
            )}`,
          )}
        </p>
        {preview.fileName ? (
          <p className="mt-3 break-all text-xs font-medium text-deep-twilight-700/70">
            {tReview("floorPlan.preview.fileLabel", {
              fileName: preview.fileName,
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type PreviewUnavailableMessageKey =
  | "missingFile"
  | "signingFailed"
  | "unsupportedFileType";

function getPreviewUnavailableMessageKey(
  preview: Extract<FloorPlanPreview, { kind: "unavailable" }>,
): PreviewUnavailableMessageKey {
  if (preview.reason === "missing_file") {
    return "missingFile";
  }

  if (preview.reason === "unsupported_file_type") {
    return "unsupportedFileType";
  }

  return "signingFailed";
}
