"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";

import type {
  RoomReviewItem,
  RoomType,
  SaveProjectRoomsResponse,
} from "@/types/room";

type RoomReviewEditorProps = {
  initialRooms: RoomReviewItem[];
  projectId: string;
};

type DraftRoom = Omit<RoomReviewItem, "id"> & {
  clientId: string;
  id?: string;
};

const roomTypeOptions: Array<{
  label: string;
  value: RoomType;
}> = [
  { label: "Living room", value: "living_room" },
  { label: "Bedroom", value: "bedroom" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Bathroom", value: "bathroom" },
  { label: "Hallway", value: "hallway" },
  { label: "Office", value: "office" },
  { label: "Unknown", value: "unknown" },
];

function createClientId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDraftRoom(room: RoomReviewItem): DraftRoom {
  return {
    ...room,
    clientId: room.id,
  };
}

function createBlankDraftRoom(): DraftRoom {
  return {
    clientId: createClientId(),
    name: "",
    type: "unknown",
  };
}

export function RoomReviewEditor({
  initialRooms,
  projectId,
}: RoomReviewEditorProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<DraftRoom[]>(
    initialRooms.map(toDraftRoom),
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addRoom() {
    setError(null);
    setSuccessMessage(null);
    setRooms((currentRooms) => [...currentRooms, createBlankDraftRoom()]);
  }

  function deleteRoom(clientId: string) {
    setError(null);
    setSuccessMessage(null);
    setRooms((currentRooms) =>
      currentRooms.filter((room) => room.clientId !== clientId),
    );
  }

  function updateRoom(
    clientId: string,
    updates: Pick<DraftRoom, "name"> | Pick<DraftRoom, "type">,
  ) {
    setError(null);
    setSuccessMessage(null);
    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.clientId === clientId ? { ...room, ...updates } : room,
      ),
    );
  }

  async function saveRooms() {
    const hasInvalidRoomName = rooms.some((room) => room.name.trim().length === 0);

    if (hasInvalidRoomName) {
      setError("Every room needs a name before saving.");
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/projects/${projectId}/rooms`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rooms: rooms.map((room) => ({
          id: room.id,
          name: room.name.trim(),
          type: room.type,
        })),
      }),
    });
    const payload = (await response
      .json()
      .catch((): SaveProjectRoomsResponse | null => null)) as
      | SaveProjectRoomsResponse
      | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      setError(
        payload && "error" in payload
          ? payload.error.message
          : "Unable to save rooms.",
      );
      return;
    }

    setRooms(payload.rooms.map(toDraftRoom));
    setSuccessMessage("Rooms saved.");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Detected rooms
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Add, correct, or remove rooms before generating suggestions.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
          onClick={addRoom}
          type="button"
        >
          Add Room
        </button>
      </div>

      {rooms.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {rooms.map((room, index) => (
            <RoomEditorRow
              index={index}
              key={room.clientId}
              onDelete={() => deleteRoom(room.clientId)}
              onNameChange={(name) => updateRoom(room.clientId, { name })}
              onTypeChange={(type) => updateRoom(room.clientId, { type })}
              room={room}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <h3 className="text-base font-semibold text-slate-950">
            No detected rooms yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Analysis and review data has not been generated for this project
            yet. Add rooms manually to continue the review workflow.
          </p>
          <button
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
            onClick={addRoom}
            type="button"
          >
            Add first room
          </button>
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {successMessage ? (
        <p className="mt-4 text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={saveRooms}
          type="button"
        >
          {isSubmitting ? "Saving..." : "Save Rooms"}
        </button>
      </div>
    </section>
  );
}

type RoomEditorRowProps = {
  index: number;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  onTypeChange: (type: RoomType) => void;
  room: DraftRoom;
};

function RoomEditorRow({
  index,
  onDelete,
  onNameChange,
  onTypeChange,
  room,
}: RoomEditorRowProps) {
  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    onTypeChange(event.target.value as RoomType);
  }

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto_auto_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Room {index + 1}
          </span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            maxLength={100}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Room name"
            type="text"
            value={room.name}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Room type
          </span>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            onChange={handleTypeChange}
            value={room.type}
          >
            {roomTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <ReadOnlyMetric
          label="Area"
          value={
            room.estimatedAreaM2 !== undefined
              ? `${room.estimatedAreaM2} m2`
              : "Not set"
          }
        />
        <ReadOnlyMetric
          label="Confidence"
          value={
            room.confidence !== undefined
              ? `${Math.round(room.confidence * 100)}%`
              : "Not set"
          }
        />

        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 shadow-sm outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-100 focus-visible:ring-offset-2"
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

type ReadOnlyMetricProps = {
  label: string;
  value: string;
};

function ReadOnlyMetric({ label, value }: ReadOnlyMetricProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
        {value}
      </p>
    </div>
  );
}
