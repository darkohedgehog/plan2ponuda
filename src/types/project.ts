export type ProjectStatus =
  | "draft"
  | "uploaded"
  | "analyzing"
  | "reviewed"
  | "quoted"
  | "failed";

export type ObjectType = "apartment" | "house" | "office";

export type Project = {
  id: string;
  userId: string;
  name: string;
  clientName?: string;
  objectType: ObjectType;
  areaM2: number;
  status: ProjectStatus;
  sourceFilePath?: string;
  previewPath?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FloorPlanPreview =
  | {
      expiresInSeconds: number;
      fileName: string;
      kind: "image";
      url: string;
    }
  | {
      expiresInSeconds: number;
      fileName: string;
      kind: "pdf";
      url: string;
    }
  | {
      fileName?: string;
      kind: "unavailable";
      reason: "missing_file" | "signing_failed" | "unsupported_file_type";
    };

export type ProjectErrorCode =
  | "file_too_large"
  | "invalid_input"
  | "invalid_file"
  | "not_found"
  | "server_error"
  | "unsupported_file_type"
  | "upload_failed";

export type ProjectError = {
  code: ProjectErrorCode;
  message: string;
};

export type CreateProjectResponse =
  | {
      ok: true;
      projectId: string;
      project: Project;
    }
  | {
      ok: false;
      error: ProjectError;
    };

export type UploadFloorPlanResponse =
  | {
      ok: true;
      success: true;
      filePath: string;
      project: Project;
    }
  | {
      ok: false;
      error: ProjectError;
    };
