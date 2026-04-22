import type { Room as DbRoom } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { runFloorPlanAnalysis } from "@/lib/ai/analysis-service";
import type { SaveProjectRoomsInput } from "@/lib/validations/room.schema";
import { getProjectById } from "@/server/services/project-service";
import type { AnalysisResult } from "@/types/analysis";
import type { Room } from "@/types/room";

type SaveProjectRoomsResult =
  | {
      ok: true;
      rooms: Room[];
    }
  | {
      ok: false;
      reason: "invalid_room_reference" | "not_found";
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

export async function getProjectRooms(
  projectId: string,
  userId: string,
): Promise<Room[]> {
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
  });

  return rooms.map(mapRoom);
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
    const existingRoomIds = new Set(
      existingRooms.map((room) => room.id),
    );
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

      if (room.id) {
        await transaction.room.update({
          where: {
            id: room.id,
          },
          data,
        });
      } else {
        await transaction.room.create({
          data: {
            ...data,
            projectId,
          },
        });
      }
    }

    await transaction.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: "reviewed",
      },
    });

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
    });

    return {
      ok: true,
      rooms: rooms.map(mapRoom),
    };
  });
}
