import { z } from "zod";

import { roomSchema, roomSuggestionSchema } from "@/lib/validations/room.schema";

export const analysisStatusSchema = z.enum(["pending", "success", "failed"]);

export const analysisRequestSchema = z.object({
  projectId: z.string().min(1),
});

export const analysisResultSchema = z.object({
  projectId: z.string().min(1),
  rooms: z.array(roomSchema).default([]),
  suggestions: z.array(roomSuggestionSchema).default([]),
});

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
export type AnalysisResultInput = z.infer<typeof analysisResultSchema>;
