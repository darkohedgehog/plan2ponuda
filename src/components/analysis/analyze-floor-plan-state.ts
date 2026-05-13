export type AnalysisFeedbackKey =
  | "analysis.errors.aiFailed"
  | "analysis.errors.invalidInput"
  | "analysis.errors.missingFloorPlan"
  | "analysis.errors.projectNotFound"
  | "analysis.errors.rateLimited"
  | "analysis.errors.roomsAlreadyExist"
  | "analysis.errors.serverError"
  | "analysis.errors.unsupportedFileType";

export type AnalysisFeedback =
  | {
      kind: "emptySuccess";
    }
  | {
      kind: "error";
      key: AnalysisFeedbackKey;
    }
  | {
      kind: "success";
      roomCount: number;
    }
  | null;

type AnalysisVisibleFeedback =
  | Exclude<AnalysisFeedback, null>
  | {
      kind: "existingRooms";
    }
  | null;

type AnalyzeFloorPlanUiStateInput = {
  feedback: AnalysisFeedback;
  hasExistingRooms: boolean;
  hasFloorPlan: boolean;
  isSubmitting: boolean;
};

type AnalyzeFloorPlanUiState = {
  button: {
    disabled: boolean;
    labelKey: "analyzeFloorPlan" | "analyzingFloorPlan";
    visible: boolean;
  };
  feedback: AnalysisVisibleFeedback;
};

export function getAnalyzeFloorPlanUiState({
  feedback,
  hasExistingRooms,
  hasFloorPlan,
  isSubmitting,
}: AnalyzeFloorPlanUiStateInput): AnalyzeFloorPlanUiState {
  return {
    button: {
      disabled: !hasFloorPlan || hasExistingRooms || isSubmitting,
      labelKey: isSubmitting ? "analyzingFloorPlan" : "analyzeFloorPlan",
      visible: !hasExistingRooms,
    },
    feedback: hasExistingRooms ? { kind: "existingRooms" } : feedback,
  };
}

export function getRoomReviewEditorStateKey(
  projectId: string,
  rooms: ReadonlyArray<{ id: string }>,
): string {
  return `${projectId}:${rooms.map((room) => room.id).join("|")}`;
}
