import "server-only";

import { randomUUID } from "node:crypto";

import type {
  ProjectDocument as DbProjectDocument,
  ProjectDocumentAnalysis as DbProjectDocumentAnalysis,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { projectDocumentAnalysisOutputSchema } from "@/lib/validations/project-document-analysis.schema";
import { validateProjectDocumentFile } from "@/lib/validations/project-document.schema";
import { getEffectivePlan } from "@/server/services/billing-service";
import {
  assertProjectOwnedStoragePath,
  buildProjectDocumentStoragePath,
} from "@/server/services/project-storage-paths";
import type {
  ProjectDocument,
  ProjectDocumentAnalysis,
  ProjectDocumentAnalysisResult,
  ProjectDocumentError,
} from "@/types/project-document";

const PROJECT_FILES_BUCKET = "project-files";
const DEFAULT_PROJECT_DOCUMENT_FILE_NAME = "project-document.pdf";

type ProjectDocumentResult =
  | {
      ok: true;
      document: ProjectDocument;
    }
  | {
      ok: false;
      error: ProjectDocumentError;
    };

type DeleteProjectDocumentResult =
  | {
      ok: true;
      documentId: string;
    }
  | {
      ok: false;
      error: ProjectDocumentError;
    };

type UploadProjectDocumentInput = {
  file: File;
  projectId: string;
  userId: string;
};

type DbProjectDocumentWithLatestAnalysis = DbProjectDocument & {
  analyses?: DbProjectDocumentAnalysis[];
};

function mapProjectDocument(
  document: DbProjectDocumentWithLatestAnalysis,
): ProjectDocument {
  const latestAnalysis = document.analyses?.at(0);

  return {
    createdAt: document.createdAt,
    fileName: document.fileName,
    filePath: document.filePath,
    id: document.id,
    latestAnalysis: latestAnalysis
      ? mapProjectDocumentAnalysis(latestAnalysis)
      : null,
    mimeType: document.mimeType,
    projectId: document.projectId,
    sizeBytes: document.sizeBytes,
    status: document.status,
    updatedAt: document.updatedAt,
  };
}

function mapProjectDocumentAnalysis(
  analysis: DbProjectDocumentAnalysis,
): ProjectDocumentAnalysis {
  return {
    createdAt: analysis.createdAt,
    errorMessage: analysis.errorMessage,
    id: analysis.id,
    model: analysis.model,
    parsedResponse: parseProjectDocumentAnalysisResult(
      analysis.parsedResponseJson,
    ),
    projectDocumentId: analysis.projectDocumentId,
    provider: analysis.provider,
    status: analysis.status,
    updatedAt: analysis.updatedAt,
  };
}

function parseProjectDocumentAnalysisResult(
  value: Prisma.JsonValue | null,
): ProjectDocumentAnalysisResult | null {
  if (value === null) {
    return null;
  }

  const parsed = projectDocumentAnalysisOutputSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

function getSafeDisplayFileName(fileName: string): string {
  const lastPathSegment = fileName.trim().split(/[\\/]/).filter(Boolean).at(-1);

  if (!lastPathSegment) {
    return DEFAULT_PROJECT_DOCUMENT_FILE_NAME;
  }

  return lastPathSegment.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 180);
}

async function removeProjectDocumentFile(filePath: string): Promise<boolean> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Project document storage cleanup failed", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Project document storage cleanup failed", error);
    return false;
  }
}

export async function getProjectDocuments(
  projectId: string,
  userId: string,
): Promise<ProjectDocument[]> {
  const documents = await prisma.projectDocument.findMany({
    include: {
      analyses: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    where: {
      projectId,
      project: {
        userId,
      },
    },
  });

  return documents.map(mapProjectDocument);
}

export async function uploadProjectDocument({
  file,
  projectId,
  userId,
}: UploadProjectDocumentInput): Promise<ProjectDocumentResult> {
  const fileValidationError = validateProjectDocumentFile(file);

  if (fileValidationError) {
    return {
      ok: false,
      error: fileValidationError,
    };
  }

  const project = await prisma.project.findFirst({
    select: {
      id: true,
    },
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: "Project not found.",
      },
    };
  }

  const effectivePlan = await getEffectivePlan(userId);

  if (effectivePlan !== "pro") {
    return {
      ok: false,
      error: {
        code: "pro_plan_required",
        message: "A Pro plan is required to upload project documentation.",
      },
    };
  }

  const documentId = randomUUID();
  const filePath = buildProjectDocumentStoragePath(project.id, documentId);
  const document = await prisma.projectDocument.create({
    data: {
      fileName: getSafeDisplayFileName(file.name),
      filePath,
      id: documentId,
      mimeType: file.type,
      projectId: project.id,
      sizeBytes: file.size,
      status: "uploaded",
    },
  });

  const supabase = createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Project document upload failed", uploadError);
    await prisma.projectDocument
      .delete({
        where: {
          id: document.id,
        },
      })
      .catch((error: unknown) => {
        console.error("Project document DB cleanup failed", error);
      });

    return {
      ok: false,
      error: {
        code: "upload_failed",
        message: "Unable to upload project documentation.",
      },
    };
  }

  // TODO(document-analysis): consume large_pdf_analyses_used in the future
  // analysis endpoint after successful AI PDF analysis, not during upload.
  return {
    ok: true,
    document: mapProjectDocument(document),
  };
}

export async function deleteProjectDocument(
  projectId: string,
  documentId: string,
  userId: string,
): Promise<DeleteProjectDocumentResult> {
  const document = await prisma.projectDocument.findFirst({
    select: {
      filePath: true,
      id: true,
    },
    where: {
      id: documentId,
      projectId,
      project: {
        userId,
      },
    },
  });

  if (!document) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: "Project document not found.",
      },
    };
  }

  let filePath: string;

  try {
    filePath = assertProjectOwnedStoragePath(projectId, document.filePath);
  } catch (error) {
    console.error("Invalid project document storage path", error);

    return {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to delete project document.",
      },
    };
  }

  const storageDeleted = await removeProjectDocumentFile(filePath);

  if (!storageDeleted) {
    return {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to delete project document.",
      },
    };
  }

  const deletedDocument = await prisma.projectDocument
    .delete({
      select: {
        id: true,
      },
      where: {
        id: document.id,
      },
    })
    .catch((error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    });

  if (!deletedDocument) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: "Project document not found.",
      },
    };
  }

  return {
    ok: true,
    documentId: deletedDocument.id,
  };
}
