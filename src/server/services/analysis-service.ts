import type {
  Room as DbRoom,
  RoomSuggestion as DbRoomSuggestion,
} from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { runFloorPlanAnalysis } from "@/lib/ai/analysis-service";
import {
  generateRoomSuggestions,
  resolveRoomSuggestion,
} from "@/lib/rules/room-rules";
import type { SaveProjectRoomsInput } from "@/lib/validations/room.schema";
import { getProjectById } from "@/server/services/project-service";
import type { AnalysisResult } from "@/types/analysis";
import type {
  Room,
  RoomReviewItem,
  RoomSuggestionReviewItem,
} from "@/types/room";

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

export async function analyzeProject(
  projectId: string,
  userId: string,
): Promise<AnalysisResult | null> {
  const project = await getProjectById(projectId, userId);

  if (!project) {
    return null;
  }

  return runFloorPlanAnalysis(projectId);
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
