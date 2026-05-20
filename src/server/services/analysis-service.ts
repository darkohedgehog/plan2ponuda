import "server-only";

import type {
  Room as DbRoom,
  RoomSuggestion as DbRoomSuggestion,
  Prisma,
} from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  aiFloorPlanAnalysisOutputSchema,
  runFloorPlanAnalysis,
  type AiFloorPlanOutput,
} from "@/lib/ai/analysis-service";
import {
  generateRoomSuggestions,
  resolveRoomSuggestion,
} from "@/lib/rules/room-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  isAllowedFloorPlanMimeType,
  type AllowedFloorPlanMimeType,
} from "@/lib/validations/project.schema";
import { isProjectOwnedStoragePath } from "@/server/services/project-storage-paths";
import type { SaveProjectRoomsInput } from "@/lib/validations/room.schema";
import type {
  Room,
  RoomReviewItem,
  RoomSuggestionReviewItem,
} from "@/types/room";

const PROJECT_FILES_BUCKET = "project-files";
const SAFE_ANALYSIS_ERROR_MESSAGES: Record<
  Exclude<AnalyzeProjectFailureReason, "not_found" | "rooms_already_exist">,
  string
> = {
  malformed_ai_response: "The AI response could not be validated.",
  missing_api_key: "AI analysis is not configured.",
  missing_floor_plan: "Upload a floor plan before running analysis.",
  provider_error: "The AI provider could not analyze this floor plan.",
  server_error: "Unable to save analysis results.",
  storage_download_failed: "Unable to read the uploaded floor plan.",
  unsupported_file_type: "The uploaded floor plan type is not supported.",
};

type SaveProjectRoomsResult =
  | {
      ok: true;
      rooms: RoomReviewItem[];
    }
  | {
      ok: false;
      reason: "invalid_room_reference" | "not_found";
    };

type DbRoomWithSuggestion = DbRoom & {
  suggestion: DbRoomSuggestion | null;
};

type AnalyzeProjectFailureReason =
  | "malformed_ai_response"
  | "missing_api_key"
  | "missing_floor_plan"
  | "not_found"
  | "provider_error"
  | "rooms_already_exist"
  | "server_error"
  | "storage_download_failed"
  | "unsupported_file_type";

export type AnalyzeProjectResult =
  | {
      analysisId: string;
      ok: true;
      roomCount: number;
      rooms: RoomReviewItem[];
    }
  | {
      ok: false;
      reason: AnalyzeProjectFailureReason;
    };

export type AnalyzeProjectPreflightResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "missing_floor_plan" | "not_found" | "rooms_already_exist";
    };

type FloorPlanStorageFile = {
  bytes: Buffer;
  fileName: string;
  mimeType: AllowedFloorPlanMimeType;
};

type FloorPlanStorageReadResult =
  | {
      file: FloorPlanStorageFile;
      ok: true;
    }
  | {
      ok: false;
      reason: "storage_download_failed" | "unsupported_file_type";
    };

function mapRoom(room: DbRoom): Room {
  return {
    id: room.id,
    projectId: room.projectId,
    name: room.name,
    type: room.type,
    estimatedAreaM2: room.estimatedAreaM2 ?? undefined,
    confidence: room.confidence ?? undefined,
    sortOrder: room.sortOrder,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function mapRoomSuggestion(
  room: Room,
  suggestion: DbRoomSuggestion | null,
): RoomSuggestionReviewItem {
  const generatedSuggestion = suggestion
    ? {
        suggestedSockets: suggestion.suggestedSockets,
        suggestedSwitches: suggestion.suggestedSwitches,
        suggestedLights: suggestion.suggestedLights,
      }
    : generateRoomSuggestions(room);
  const resolvedSuggestion = resolveRoomSuggestion(generatedSuggestion, {
    userSockets: suggestion?.userSockets ?? undefined,
    userSwitches: suggestion?.userSwitches ?? undefined,
    userLights: suggestion?.userLights ?? undefined,
  });

  return {
    id: suggestion?.id,
    ...resolvedSuggestion,
  };
}

function mapRoomReviewItem(room: DbRoomWithSuggestion): RoomReviewItem {
  const mappedRoom = mapRoom(room);

  return {
    id: mappedRoom.id,
    name: mappedRoom.name,
    type: mappedRoom.type,
    estimatedAreaM2: mappedRoom.estimatedAreaM2,
    confidence: mappedRoom.confidence,
    suggestion: mapRoomSuggestion(mappedRoom, room.suggestion),
  };
}

function hasStaleGeneratedSuggestion(
  suggestion: DbRoomSuggestion,
  generatedSuggestion: ReturnType<typeof generateRoomSuggestions>,
): boolean {
  return (
    suggestion.suggestedSockets !== generatedSuggestion.suggestedSockets ||
    suggestion.suggestedSwitches !== generatedSuggestion.suggestedSwitches ||
    suggestion.suggestedLights !== generatedSuggestion.suggestedLights
  );
}

export async function getAnalyzeProjectPreflight(
  projectId: string,
  userId: string,
): Promise<AnalyzeProjectPreflightResult> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      _count: {
        select: {
          rooms: true,
        },
      },
    },
  });

  if (!project) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  if (
    !project.sourceFilePath ||
    !isProjectOwnedStoragePath(project.id, project.sourceFilePath)
  ) {
    return {
      ok: false,
      reason: "missing_floor_plan",
    };
  }

  // MVP safety: AI analysis only seeds rooms for empty projects so manual
  // room edits are never overwritten by a later analysis run.
  if (project._count.rooms > 0) {
    return {
      ok: false,
      reason: "rooms_already_exist",
    };
  }

  return {
    ok: true,
  };
}

export async function analyzeProject(
  projectId: string,
  userId: string,
): Promise<AnalyzeProjectResult> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      _count: {
        select: {
          rooms: true,
        },
      },
    },
  });

  if (!project) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  if (!project.sourceFilePath) {
    return {
      ok: false,
      reason: "missing_floor_plan",
    };
  }

  if (!isProjectOwnedStoragePath(project.id, project.sourceFilePath)) {
    warnInvalidStoredProjectPath("analysis", project.id);

    return {
      ok: false,
      reason: "missing_floor_plan",
    };
  }

  // Re-check after route preflight to avoid overwriting rooms created meanwhile.
  if (project._count.rooms > 0) {
    return {
      ok: false,
      reason: "rooms_already_exist",
    };
  }

  const analysis = await prisma.$transaction(async (transaction) => {
    const createdAnalysis = await transaction.analysis.create({
      data: {
        projectId: project.id,
        provider: "openai",
        status: "pending",
      },
      select: {
        id: true,
      },
    });

    await transaction.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: "analyzing",
      },
    });

    return createdAnalysis;
  });

  const floorPlan = await readFloorPlanFromStorage(
    project.id,
    project.sourceFilePath,
  );

  if (!floorPlan.ok) {
    await markAnalysisFailed(analysis.id, project.id, floorPlan.reason);

    return {
      ok: false,
      reason: floorPlan.reason,
    };
  }

  const aiAnalysis = await runFloorPlanAnalysis({
    floorPlan: floorPlan.file,
    projectId: project.id,
  });

  if (!aiAnalysis.ok) {
    await markAnalysisFailed(analysis.id, project.id, aiAnalysis.reason);

    return aiAnalysis;
  }

  const parsedResponse = aiFloorPlanAnalysisOutputSchema.safeParse(
    aiAnalysis.parsedResponse,
  );

  if (!parsedResponse.success) {
    console.error("Validated AI response failed final room schema", {
      analysisId: analysis.id,
      issues: parsedResponse.error.issues,
      projectId: project.id,
    });
    await markAnalysisFailed(analysis.id, project.id, "malformed_ai_response");

    return {
      ok: false,
      reason: "malformed_ai_response",
    };
  }

  try {
    const rooms = await persistSuccessfulAnalysis({
      analysisId: analysis.id,
      parsedResponse: parsedResponse.data,
      projectId: project.id,
      rawResponseJson: aiAnalysis.rawResponseJson,
    });

    return {
      analysisId: analysis.id,
      ok: true,
      roomCount: rooms.length,
      rooms,
    };
  } catch (error) {
    console.error("Persisting floor plan analysis failed", error);
    await markAnalysisFailed(analysis.id, project.id, "server_error");

    return {
      ok: false,
      reason: "server_error",
    };
  }
}

async function persistSuccessfulAnalysis(params: {
  analysisId: string;
  parsedResponse: AiFloorPlanOutput;
  projectId: string;
  rawResponseJson: unknown;
}): Promise<RoomReviewItem[]> {
  return prisma.$transaction(async (transaction) => {
    const hydratedRooms: DbRoomWithSuggestion[] = [];

    for (const [index, detectedRoom] of params.parsedResponse.rooms.entries()) {
      const room = await transaction.room.create({
        data: {
          confidence: detectedRoom.confidence ?? null,
          estimatedAreaM2: detectedRoom.estimatedAreaM2 ?? null,
          name: detectedRoom.name,
          projectId: params.projectId,
          sortOrder: index,
          type: detectedRoom.type,
        },
      });
      const suggestion = await transaction.roomSuggestion.create({
        data: {
          roomId: room.id,
          ...generateRoomSuggestions(mapRoom(room)),
        },
      });

      hydratedRooms.push({
        ...room,
        suggestion,
      });
    }

    await transaction.analysis.update({
      where: {
        id: params.analysisId,
      },
      data: {
        errorMessage: null,
        parsedResponseJson: toPrismaJson(params.parsedResponse),
        rawResponseJson: toPrismaJson(params.rawResponseJson),
        status: "success",
      },
    });

    await transaction.project.update({
      where: {
        id: params.projectId,
      },
      data: {
        status: "uploaded",
      },
    });

    return hydratedRooms.map(mapRoomReviewItem);
  });
}

async function markAnalysisFailed(
  analysisId: string,
  projectId: string,
  reason: Exclude<AnalyzeProjectFailureReason, "not_found" | "rooms_already_exist">,
): Promise<void> {
  await prisma.$transaction([
    prisma.analysis.update({
      where: {
        id: analysisId,
      },
      data: {
        errorMessage: SAFE_ANALYSIS_ERROR_MESSAGES[reason],
        status: "failed",
      },
    }),
    prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        status: "failed",
      },
    }),
  ]);
}

async function readFloorPlanFromStorage(
  projectId: string,
  sourceFilePath: string,
): Promise<FloorPlanStorageReadResult> {
  if (!isProjectOwnedStoragePath(projectId, sourceFilePath)) {
    warnInvalidStoredProjectPath("storage_download", projectId);

    return {
      ok: false,
      reason: "storage_download_failed",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .download(sourceFilePath);

    if (error || !data) {
      console.error("Floor plan storage download failed", error);

      return {
        ok: false,
        reason: "storage_download_failed",
      };
    }

    const mimeType = resolveFloorPlanMimeType(sourceFilePath, data.type);

    if (!mimeType) {
      return {
        ok: false,
        reason: "unsupported_file_type",
      };
    }

    return {
      file: {
        bytes: Buffer.from(await data.arrayBuffer()),
        fileName: getStoredFileName(sourceFilePath),
        mimeType,
      },
      ok: true,
    };
  } catch (error) {
    console.error("Floor plan storage download failed", error);

    return {
      ok: false,
      reason: "storage_download_failed",
    };
  }
}

function warnInvalidStoredProjectPath(context: string, projectId: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Ignored invalid project storage path", {
      context,
      projectId,
    });
  }
}

function resolveFloorPlanMimeType(
  sourceFilePath: string,
  storedMimeType: string,
): AllowedFloorPlanMimeType | null {
  if (isAllowedFloorPlanMimeType(storedMimeType)) {
    return storedMimeType;
  }

  const extension = sourceFilePath.split(".").at(-1)?.toLowerCase();

  if (extension === "pdf") {
    return "application/pdf";
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  return null;
}

function getStoredFileName(filePath: string): string {
  return filePath.split("/").filter(Boolean).at(-1) ?? "floor-plan";
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function getProjectRoomsForReview(
  projectId: string,
  userId: string,
): Promise<RoomReviewItem[]> {
  const rooms = await prisma.room.findMany({
    where: {
      projectId,
      project: {
        userId,
      },
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
    include: {
      suggestion: true,
    },
  });
  const hydratedRooms: DbRoomWithSuggestion[] = [];

  for (const room of rooms) {
    const mappedRoom = mapRoom(room);
    const generatedSuggestion = generateRoomSuggestions(mappedRoom);

    if (
      !room.suggestion ||
      hasStaleGeneratedSuggestion(room.suggestion, generatedSuggestion)
    ) {
      const suggestion = await prisma.roomSuggestion.upsert({
        where: {
          roomId: room.id,
        },
        update: generatedSuggestion,
        create: {
          roomId: room.id,
          ...generatedSuggestion,
        },
      });

      hydratedRooms.push({
        ...room,
        suggestion,
      });
    } else {
      hydratedRooms.push(room);
    }
  }

  return hydratedRooms.map(mapRoomReviewItem);
}

export async function saveProjectRooms(
  projectId: string,
  userId: string,
  input: SaveProjectRoomsInput,
): Promise<SaveProjectRoomsResult> {
  return prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return {
        ok: false,
        reason: "not_found",
      };
    }

    const existingRooms = await transaction.room.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
      },
    });
    const existingRoomIds = new Set(existingRooms.map((room) => room.id));
    const roomIdsToKeep = input.rooms
      .map((room) => room.id)
      .filter((roomId): roomId is string => roomId !== undefined);

    if (roomIdsToKeep.some((roomId) => !existingRoomIds.has(roomId))) {
      return {
        ok: false,
        reason: "invalid_room_reference",
      };
    }

    await transaction.room.deleteMany({
      where: {
        projectId,
        id: {
          notIn: roomIdsToKeep,
        },
      },
    });

    for (const [index, room] of input.rooms.entries()) {
      const data = {
        name: room.name,
        sortOrder: index,
        type: room.type,
      };
      const savedRoom = room.id
        ? await transaction.room.update({
            where: {
              id: room.id,
            },
            data,
          })
        : await transaction.room.create({
            data: {
              ...data,
              projectId,
            },
          });
      const generatedSuggestion = generateRoomSuggestions(mapRoom(savedRoom));

      await transaction.roomSuggestion.upsert({
        where: {
          roomId: savedRoom.id,
        },
        update: {
          ...generatedSuggestion,
          userSockets: room.suggestion.userSockets ?? null,
          userSwitches: room.suggestion.userSwitches ?? null,
          userLights: room.suggestion.userLights ?? null,
        },
        create: {
          roomId: savedRoom.id,
          ...generatedSuggestion,
          userSockets: room.suggestion.userSockets ?? null,
          userSwitches: room.suggestion.userSwitches ?? null,
          userLights: room.suggestion.userLights ?? null,
        },
      });
    }

    const rooms = await transaction.room.findMany({
      where: {
        projectId,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      include: {
        suggestion: true,
      },
    });

    await transaction.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: "reviewed",
      },
    });

    return {
      ok: true,
      rooms: rooms.map(mapRoomReviewItem),
    };
  });
}
