export type ProjectDocumentStatus =
  | "uploaded"
  | "analysis_pending"
  | "analyzing"
  | "analyzed"
  | "failed";

export type ProjectDocumentAnalysisStatus =
  | "pending"
  | "analyzing"
  | "completed"
  | "failed";

export type ProjectDocumentDetectedSystem =
  | "power_distribution"
  | "lighting"
  | "sockets"
  | "switches"
  | "distribution_board"
  | "low_voltage"
  | "network"
  | "fire_alarm"
  | "grounding"
  | "lightning_protection"
  | "hvac_connections"
  | "other";

export type ProjectDocumentMaterialCandidate = {
  category: "cable" | "socket" | "switch" | "breaker" | "box" | "panel" | "other";
  confidence: number;
  name: string;
  notes: string | null;
  quantity: number | null;
  sourceReference: string | null;
  unit: "pcs" | "m" | "set";
};

export type ProjectDocumentLaborCandidate = {
  confidence: number;
  description: string | null;
  name: string;
  notes: string | null;
  quantity: number | null;
  sourceReference: string | null;
  unit: "hour" | "item" | "m2" | "m" | "set";
};

export type ProjectDocumentAnalysisResult = {
  assumptions: string[];
  detectedSystems: ProjectDocumentDetectedSystem[];
  laborCandidates: ProjectDocumentLaborCandidate[];
  materialCandidates: ProjectDocumentMaterialCandidate[];
  missingInformation: string[];
  overallConfidence: number;
  projectSummary: string;
};

export type ProjectDocumentAnalysis = {
  createdAt: Date;
  errorMessage: string | null;
  id: string;
  model: string | null;
  parsedResponse: ProjectDocumentAnalysisResult | null;
  projectDocumentId: string;
  provider: string;
  status: ProjectDocumentAnalysisStatus;
  updatedAt: Date;
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: ProjectDocumentStatus;
  createdAt: Date;
  latestAnalysis?: ProjectDocumentAnalysis | null;
  updatedAt: Date;
};

export type ProjectDocumentErrorCode =
  | "ai_failed"
  | "already_analyzed"
  | "analysis_failed"
  | "analysis_in_progress"
  | "analysis_limit_reached"
  | "file_too_large"
  | "invalid_file"
  | "invalid_input"
  | "invalid_storage_path"
  | "not_found"
  | "pro_plan_required"
  | "rate_limited"
  | "server_error"
  | "storage_download_failed"
  | "unsupported_file_type"
  | "upload_failed";

export type ProjectDocumentError = {
  code: ProjectDocumentErrorCode;
  message: string;
};

export type UploadProjectDocumentResponse =
  | {
      ok: true;
      document: ProjectDocument;
    }
  | {
      ok: false;
      error: ProjectDocumentError;
    };

export type ProjectDocumentsResponse =
  | {
      ok: true;
      documents: ProjectDocument[];
    }
  | {
      ok: false;
      error: ProjectDocumentError;
    };

export type DeleteProjectDocumentResponse =
  | {
      ok: true;
      documentId: string;
    }
  | {
      ok: false;
      error: ProjectDocumentError;
    };

export type AnalyzeProjectDocumentResponse =
  | {
      ok: true;
      analysis: ProjectDocumentAnalysis;
      document: ProjectDocument;
      reusedExisting: boolean;
    }
  | {
      ok: false;
      error: ProjectDocumentError;
    };
