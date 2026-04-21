import type { AnalysisResult } from "@/types/analysis";

export async function runFloorPlanAnalysis(
  projectId: string,
): Promise<AnalysisResult> {
  return {
    projectId,
    rooms: [],
    suggestions: [],
  };
}
