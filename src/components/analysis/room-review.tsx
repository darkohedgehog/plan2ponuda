import type { FloorPlanPreview, Project } from "@/types/project";
import type { Room, RoomType } from "@/types/room";

type ReviewProject = Pick<Project, "name" | "status">;

type RoomReviewProps = {
  floorPlanPreview: FloorPlanPreview;
  project: ReviewProject;
  rooms: Room[];
};

export function RoomReview({
  floorPlanPreview,
  project,
  rooms,
}: RoomReviewProps) {
  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Room review</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {project.name}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Review detected rooms before moving into electrical suggestions,
          materials, and quote generation.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <FloorPlanCard preview={floorPlanPreview} project={project} />
        <DetectedRoomsCard rooms={rooms} />
      </section>
    </main>
  );
}

type FloorPlanCardProps = {
  preview: FloorPlanPreview;
  project: ReviewProject;
};

function FloorPlanCard({ preview, project }: FloorPlanCardProps) {
  const hasFloorPlan =
    preview.kind !== "unavailable" || preview.reason !== "missing_file";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Floor plan</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Use the uploaded floor plan as the reference for room review.
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Upload status
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {hasFloorPlan ? "Floor plan uploaded" : "No floor plan uploaded"}
            </p>
          </div>
          <span
            className={`m-5 inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
              hasFloorPlan
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-slate-200"
            }`}
          >
            {project.status}
          </span>
        </div>

        <FloorPlanPreviewContent preview={preview} />
      </div>
    </section>
  );
}

type FloorPlanPreviewContentProps = {
  preview: FloorPlanPreview;
};

function FloorPlanPreviewContent({ preview }: FloorPlanPreviewContentProps) {
  if (preview.kind === "image") {
    return (
      <figure className="border-t border-slate-200 bg-white p-4">
        {/* Native img keeps short-lived signed Supabase URLs out of Next image config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Floor plan preview for ${preview.fileName}`}
          className="max-h-140 w-full rounded-md border border-slate-200 object-contain"
          src={preview.url}
        />
        <figcaption className="mt-3 text-xs text-slate-500">
          Signed preview for {preview.fileName}. The URL expires in{" "}
          {formatExpiry(preview.expiresInSeconds)}.
        </figcaption>
      </figure>
    );
  }

  if (preview.kind === "pdf") {
    return (
      <div className="border-t border-slate-200 bg-white p-5">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">
            PDF floor plan available
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Open the signed PDF preview in a new tab. The URL expires in{" "}
            {formatExpiry(preview.expiresInSeconds)}.
          </p>
          <a
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
            href={preview.url}
            rel="noreferrer"
            target="_blank"
          >
            Open PDF preview
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-white p-5">
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">
          Preview unavailable
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {getPreviewUnavailableMessage(preview)}
        </p>
        {preview.fileName ? (
          <p className="mt-3 break-all text-xs font-medium text-slate-500">
            File: {preview.fileName}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function formatExpiry(expiresInSeconds: number): string {
  const minutes = Math.max(1, Math.round(expiresInSeconds / 60));

  return `${minutes} min`;
}

function getPreviewUnavailableMessage(
  preview: Extract<FloorPlanPreview, { kind: "unavailable" }>,
): string {
  if (preview.reason === "missing_file") {
    return "Upload a floor plan before reviewing the visual preview.";
  }

  if (preview.reason === "unsupported_file_type") {
    return "This floor plan file type cannot be previewed safely yet.";
  }

  return "The signed preview URL could not be generated. The file remains stored privately.";
}

type DetectedRoomsCardProps = {
  rooms: Room[];
};

function DetectedRoomsCard({ rooms }: DetectedRoomsCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Detected rooms</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Rooms generated by analysis will appear here for review.
        </p>
      </div>

      {rooms.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {rooms.map((room) => (
            <RoomListItem key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <h3 className="text-base font-semibold text-slate-950">
            No detected rooms yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Analysis and review data has not been generated for this project
            yet. Once room detection runs, rooms will be listed here.
          </p>
        </div>
      )}
    </section>
  );
}

type RoomListItemProps = {
  room: Room;
};

function RoomListItem({ room }: RoomListItemProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">
            {room.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {formatRoomType(room.type)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {room.estimatedAreaM2 !== undefined ? (
            <MetadataBadge label={`${room.estimatedAreaM2} m2`} />
          ) : null}
          {room.confidence !== undefined ? (
            <MetadataBadge label={`${Math.round(room.confidence * 100)}%`} />
          ) : null}
        </div>
      </div>
    </article>
  );
}

type MetadataBadgeProps = {
  label: string;
};

function MetadataBadge({ label }: MetadataBadgeProps) {
  return (
    <span className="inline-flex rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
      {label}
    </span>
  );
}

function formatRoomType(roomType: RoomType): string {
  const roomTypeLabels: Record<RoomType, string> = {
    bathroom: "Bathroom",
    bedroom: "Bedroom",
    hallway: "Hallway",
    kitchen: "Kitchen",
    living_room: "Living room",
    office: "Office",
    unknown: "Unknown",
  };

  return roomTypeLabels[roomType];
}
