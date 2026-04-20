import { runFloorPlanAnalysis } from "@/lib/ai/analysis-service";
import { getProjectById } from "@/server/services/project-service";
import type { Analysis } from "@/types/analysis";

export async function analyzeProject(
  projectId: string,
  ownerId: string,
): Promise<Analysis | null> {
  const project = await getProjectById(projectId, ownerId);

  if (!project) {
    return null;
  }

  return runFloorPlanAnalysis(projectId);
}
