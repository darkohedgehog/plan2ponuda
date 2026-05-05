"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";

import {
  generateRoomSuggestions,
  resolveRoomSuggestion,
} from "@/lib/rules/room-rules";
import type {
  RoomErrorCode,
  RoomReviewItem,
  RoomSuggestionReviewItem,
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

type SuggestionOverrideKey = "userSockets" | "userSwitches" | "userLights";
type SuggestionLabelKey = "lights" | "sockets" | "switches";
type ReviewErrorMessageKey =
  | "errors.invalidInput"
  | "errors.invalidRoomReference"
  | "errors.projectNotFound"
  | "errors.roomNameRequired"
  | "errors.serverError";

type SuggestionInputConfig = {
  labelKey: SuggestionLabelKey;
  overrideKey: SuggestionOverrideKey;
  resolvedKey: "resolvedSockets" | "resolvedSwitches" | "resolvedLights";
  suggestedKey: "suggestedSockets" | "suggestedSwitches" | "suggestedLights";
};

const roomTypeOptions: RoomType[] = [
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "hallway",
  "office",
  "unknown",
];

const suggestionInputConfigs: SuggestionInputConfig[] = [
  {
    labelKey: "sockets",
    overrideKey: "userSockets",
    resolvedKey: "resolvedSockets",
    suggestedKey: "suggestedSockets",
  },
  {
    labelKey: "switches",
    overrideKey: "userSwitches",
    resolvedKey: "resolvedSwitches",
    suggestedKey: "suggestedSwitches",
  },
  {
    labelKey: "lights",
    overrideKey: "userLights",
    resolvedKey: "resolvedLights",
    suggestedKey: "suggestedLights",
  },
];

const reviewErrorKeysByCode: Record<RoomErrorCode, ReviewErrorMessageKey> = {
  invalid_input: "errors.invalidInput",
  invalid_room_reference: "errors.invalidRoomReference",
  not_found: "errors.projectNotFound",
  server_error: "errors.serverError",
};

function createClientId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDraftRoom(room: RoomReviewItem): DraftRoom {
  return applyGeneratedSuggestion({
    ...room,
    clientId: room.id,
  });
}

function createBlankDraftRoom(): DraftRoom {
  return applyGeneratedSuggestion({
    clientId: createClientId(),
    name: "",
    suggestion: createGeneratedSuggestion("unknown"),
    type: "unknown",
  });
}

function createGeneratedSuggestion(
  type: RoomType,
  estimatedAreaM2?: number,
): RoomSuggestionReviewItem {
  return resolveRoomSuggestion(
    generateRoomSuggestions({
      estimatedAreaM2,
      type,
    }),
  );
}

function applyGeneratedSuggestion(room: DraftRoom): DraftRoom {
  const generatedSuggestion = generateRoomSuggestions(room);

  return {
    ...room,
    suggestion: {
      id: room.suggestion.id,
      ...resolveRoomSuggestion(generatedSuggestion, {
        userSockets: room.suggestion.userSockets,
        userSwitches: room.suggestion.userSwitches,
        userLights: room.suggestion.userLights,
      }),
    },
  };
}

function parseSuggestionInputValue(value: string): number {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return Math.max(0, parsedValue);
}

export function RoomReviewEditor({
  initialRooms,
  projectId,
}: RoomReviewEditorProps) {
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tEmptyRooms = useTranslations("EmptyStates.rooms.noDetected");
  const tReview = useTranslations("Review");
  const tRooms = useTranslations("Rooms");
  const [rooms, setRooms] = useState<DraftRoom[]>(
    initialRooms.map(toDraftRoom),
  );
  const [errorKey, setErrorKey] = useState<ReviewErrorMessageKey | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addRoom() {
    setErrorKey(null);
    setIsSaved(false);
    setRooms((currentRooms) => [...currentRooms, createBlankDraftRoom()]);
  }

  function deleteRoom(clientId: string) {
    setErrorKey(null);
    setIsSaved(false);
    setRooms((currentRooms) =>
      currentRooms.filter((room) => room.clientId !== clientId),
    );
  }

  function updateRoom(
    clientId: string,
    updates: Pick<DraftRoom, "name"> | Pick<DraftRoom, "type">,
  ) {
    setErrorKey(null);
    setIsSaved(false);
    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.clientId === clientId
          ? applyGeneratedSuggestion({ ...room, ...updates })
          : room,
      ),
    );
  }

  function updateSuggestion(
    clientId: string,
    overrideKey: SuggestionOverrideKey,
    nextValue: number,
  ) {
    setErrorKey(null);
    setIsSaved(false);
    setRooms((currentRooms) =>
      currentRooms.map((room) => {
        if (room.clientId !== clientId) {
          return room;
        }

        const generatedSuggestion = generateRoomSuggestions(room);
        const generatedValue =
          overrideKey === "userSockets"
            ? generatedSuggestion.suggestedSockets
            : overrideKey === "userSwitches"
              ? generatedSuggestion.suggestedSwitches
              : generatedSuggestion.suggestedLights;

        return applyGeneratedSuggestion({
          ...room,
          suggestion: {
            ...room.suggestion,
            [overrideKey]:
              nextValue === generatedValue ? undefined : nextValue,
          },
        });
      }),
    );
  }

  async function saveRooms() {
    const hasInvalidRoomName = rooms.some(
      (room) => room.name.trim().length === 0,
    );

    if (hasInvalidRoomName) {
      setErrorKey("errors.roomNameRequired");
      setIsSaved(false);
      return;
    }

    setErrorKey(null);
    setIsSaved(false);
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
          suggestion: {
            userSockets: room.suggestion.userSockets ?? null,
            userSwitches: room.suggestion.userSwitches ?? null,
            userLights: room.suggestion.userLights ?? null,
          },
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
      setErrorKey(
        payload && "error" in payload
          ? reviewErrorKeysByCode[payload.error.code]
          : "errors.serverError",
      );
      return;
    }

    setRooms(payload.rooms.map(toDraftRoom));
    setIsSaved(true);
    router.refresh();
  }

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950">
            {tRooms("editor.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {tRooms("editor.subtitle")}
          </p>
        </div>
        <button
          className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-auto"
          onClick={addRoom}
          type="button"
        >
          {tActions("addRoom")}
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
              onSuggestionChange={(overrideKey, value) =>
                updateSuggestion(room.clientId, overrideKey, value)
              }
              onTypeChange={(type) => updateRoom(room.clientId, { type })}
              room={room}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <h3 className="text-base font-semibold text-slate-950">
            {tEmptyRooms("title")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            {tEmptyRooms("description")}
          </p>
          <button
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            onClick={addRoom}
            type="button"
          >
            {tActions("addFirstRoom")}
          </button>
        </div>
      )}

      {errorKey ? (
        <p className="mt-4 text-sm text-red-600">{tReview(errorKey)}</p>
      ) : null}
      {isSaved ? (
        <p className="mt-4 text-sm text-emerald-700">
          {tReview("messages.saved")}
        </p>
      ) : null}

      <div className="mt-5 flex sm:justify-end">
        <button
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isSubmitting}
          onClick={saveRooms}
          type="button"
        >
          {isSubmitting ? tActions("saving") : tActions("saveRooms")}
        </button>
      </div>
    </section>
  );
}

type RoomEditorRowProps = {
  index: number;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  onSuggestionChange: (
    overrideKey: SuggestionOverrideKey,
    value: number,
  ) => void;
  onTypeChange: (type: RoomType) => void;
  room: DraftRoom;
};

function RoomEditorRow({
  index,
  onDelete,
  onNameChange,
  onSuggestionChange,
  onTypeChange,
  room,
}: RoomEditorRowProps) {
  const tActions = useTranslations("Actions");
  const tCommon = useTranslations("Common");
  const tRooms = useTranslations("Rooms");
  const tRoomTypes = useTranslations("RoomTypes");

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    onTypeChange(event.target.value as RoomType);
  }

  return (
    <article className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.55fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(12rem,0.55fr)]">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {tRooms("fields.roomNumber", { number: index + 1 })}
            </span>
            <input
              className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              maxLength={100}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={tRooms("fields.namePlaceholder")}
              type="text"
              value={room.name}
            />
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {tRooms("fields.type")}
            </span>
            <select
              className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              onChange={handleTypeChange}
              value={room.type}
            >
              {roomTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {tRoomTypes(option)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ReadOnlyMetric
            label={tRooms("fields.estimatedArea")}
            value={
              room.estimatedAreaM2 !== undefined
                ? `${room.estimatedAreaM2} m2`
                : tCommon("notSet")
            }
          />
          <ReadOnlyMetric
            label={tRooms("fields.confidence")}
            value={
              room.confidence !== undefined
                ? `${Math.round(room.confidence * 100)}%`
                : tCommon("notSet")
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          {suggestionInputConfigs.map((config) => (
            <SuggestionInput
              config={config}
              key={config.overrideKey}
              onChange={(value) =>
                onSuggestionChange(config.overrideKey, value)
              }
              suggestion={room.suggestion}
            />
          ))}
        </div>

        <div className="flex border-t border-slate-200 pt-4 sm:justify-end">
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 shadow-sm outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-100 focus-visible:ring-offset-2 sm:w-auto"
            onClick={onDelete}
            type="button"
          >
            {tActions("delete")}
          </button>
        </div>
      </div>
    </article>
  );
}

type SuggestionInputProps = {
  config: SuggestionInputConfig;
  onChange: (value: number) => void;
  suggestion: RoomSuggestionReviewItem;
};

function SuggestionInput({
  config,
  onChange,
  suggestion,
}: SuggestionInputProps) {
  const tSuggestions = useTranslations("Suggestions");
  const isOverride = suggestion[config.overrideKey] !== undefined;

  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {tSuggestions(config.labelKey)}
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal ${
            isOverride
              ? "bg-blue-50 text-blue-700"
              : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200"
          }`}
        >
          {isOverride
            ? tSuggestions("override")
            : tSuggestions("suggested")}
        </span>
      </span>
      <input
        className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        min={0}
        onChange={(event) =>
          onChange(parseSuggestionInputValue(event.target.value))
        }
        type="number"
        value={suggestion[config.resolvedKey]}
      />
      <span className="text-xs text-slate-500">
        {tSuggestions("suggestedValue", {
          value: suggestion[config.suggestedKey],
        })}
      </span>
    </label>
  );
}

type ReadOnlyMetricProps = {
  label: string;
  value: string;
};

function ReadOnlyMetric({ label, value }: ReadOnlyMetricProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 flex h-10 min-w-0 items-center truncate rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
        {value}
      </p>
    </div>
  );
}
