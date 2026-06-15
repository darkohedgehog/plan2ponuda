import type { Room, RoomSuggestion } from "@/types/room";

export type AnalysisStatus = "pending" | "success" | "failed";

export type AnalysisErrorCode =
  | "ai_failed"
  | "analysis_in_progress"
  | "invalid_input"
  | "missing_floor_plan"
  | "not_found"
  | "rate_limited"
  | "rooms_already_exist"
  | "server_error"
  | "unsupported_file_type";

export type AnalysisError = {
  code: AnalysisErrorCode;
  message: string;
};

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

export type AnalyzeProjectResponse =
  | {
      analysis: {
        id: string;
        roomCount: number;
        status: "success";
      };
      ok: true;
    }
  | {
      error: AnalysisError;
      ok: false;
    };
