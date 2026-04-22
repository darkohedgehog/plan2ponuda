import type { Room as DbRoom } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { runFloorPlanAnalysis } from "@/lib/ai/analysis-service";
import { getProjectById } from "@/server/services/project-service";
import type { AnalysisResult } from "@/types/analysis";
import type { Room } from "@/types/room";

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
