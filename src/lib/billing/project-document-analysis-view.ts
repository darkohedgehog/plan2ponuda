export type ProjectDocumentAnalysisViewStatus =
  | "analysis_pending"
  | "analyzed"
  | "analyzing"
  | "failed"
  | "uploaded";

export type ProjectDocumentAnalysisUiState = {
  canAnalyze: boolean;
  showSummary: boolean;
  state: "analyzed" | "analyzing" | "failed" | "ready";
};

export function getProjectDocumentAnalysisUiState(
  status: ProjectDocumentAnalysisViewStatus,
): ProjectDocumentAnalysisUiState {
  switch (status) {
    case "analyzed":
      return {
        canAnalyze: false,
        showSummary: true,
        state: "analyzed",
      };
    case "analyzing":
      return {
        canAnalyze: false,
        showSummary: false,
        state: "analyzing",
      };
    case "failed":
      return {
        canAnalyze: true,
        showSummary: false,
        state: "failed",
      };
    case "analysis_pending":
    case "uploaded":
      return {
        canAnalyze: true,
        showSummary: false,
        state: "ready",
      };
  }
}
