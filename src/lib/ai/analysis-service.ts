import type { Analysis } from "@/types/analysis";

export async function runFloorPlanAnalysis(
  projectId: string,
): Promise<Analysis> {
  return {
    projectId,
    rooms: [],
    suggestions: [],
  };
}
