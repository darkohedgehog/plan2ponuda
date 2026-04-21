import { runFloorPlanAnalysis } from "@/lib/ai/analysis-service";
import { getProjectById } from "@/server/services/project-service";
import type { AnalysisResult } from "@/types/analysis";

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
