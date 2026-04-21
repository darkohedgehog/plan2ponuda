import type { Room, RoomSuggestion } from "@/types/room";

export type AnalysisStatus = "pending" | "success" | "failed";

export type Analysis = {
  id: string;
  projectId: string;
  provider: string;
  rawResponseJson?: unknown;
  parsedResponseJson?: unknown;
  status: AnalysisStatus;
  errorMessage?: string;
  createdAt: Date;
};

export type AnalysisResult = {
  projectId: string;
  rooms: Room[];
  suggestions: RoomSuggestion[];
};
