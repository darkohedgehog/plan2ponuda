import { z } from "zod";

export const analysisRequestSchema = z.object({
  projectId: z.string().min(1),
});

export const analysisResultSchema = z.object({
  rooms: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
