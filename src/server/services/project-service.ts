import "server-only";

import type { Project as DbProject } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  getFloorPlanFileExtension,
  isAllowedFloorPlanMimeType,
  validateFloorPlanFile,
  type CreateProjectInput,
} from "@/lib/validations/project.schema";
import type {
  FloorPlanPreview,
  Project,
  UploadFloorPlanResponse,
} from "@/types/project";

const PROJECT_FILES_BUCKET = "project-files";
const FLOOR_PLAN_PREVIEW_URL_TTL_SECONDS = 5 * 60;

function mapProject(project: DbProject): Project {
  return {
    id: project.id,
    userId: project.userId,
    name: project.name,
    clientName: project.clientName ?? undefined,
    objectType: project.objectType,
    areaM2: project.areaM2,
    status: project.status,
    sourceFilePath: project.sourceFilePath ?? undefined,
    previewPath: project.previewPath ?? undefined,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return projects.map(mapProject);
}

export type ProjectDashboardStats = {
  totalProjects: number;
  draftProjects: number;
  reviewedProjects: number;
  quotedProjects: number;
};

export type ProjectDashboardOverview = {
  stats: ProjectDashboardStats;
  recentProjects: Project[];
};

export async function getUserProjectDashboardOverview(
  userId: string,
): Promise<ProjectDashboardOverview> {
  const [
    recentProjects,
    totalProjects,
    draftProjects,
    reviewedProjects,
    quotedProjects,
  ] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.project.count({
      where: { userId },
    }),
    prisma.project.count({
      where: { userId, status: "draft" },
    }),
    prisma.project.count({
      where: { userId, status: "reviewed" },
    }),
    prisma.project.count({
      where: { userId, status: "quoted" },
    }),
  ]);

  return {
    stats: {
      totalProjects,
      draftProjects,
      reviewedProjects,
      quotedProjects,
    },
    recentProjects: recentProjects.map(mapProject),
  };
}

export async function createProject(
  input: CreateProjectInput,
  userId: string,
): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      userId,
      name: input.name,
      clientName: input.clientName,
      objectType: input.objectType,
      areaM2: input.areaM2,
      sourceFilePath: input.sourceFilePath,
      previewPath: input.previewPath,
    },
  });

  return mapProject(project);
}

export async function getProjectById(
  projectId: string,
  userId: string,
): Promise<Project | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  return project ? mapProject(project) : null;
}

function getStoredFileName(filePath: string): string {
  return filePath.split("/").filter(Boolean).at(-1) ?? "floor plan";
}

function getFloorPlanPreviewKind(
  filePath: string,
): "image" | "pdf" | "unsupported_file_type" {
  const extension = filePath.split(".").at(-1)?.toLowerCase();

  if (extension === "pdf") {
    return "pdf";
  }

  if (extension === "jpg" || extension === "jpeg" || extension === "png") {
    return "image";
  }

  return "unsupported_file_type";
}

export async function createSignedFloorPlanUrl(
  sourceFilePath?: string,
): Promise<FloorPlanPreview> {
  if (!sourceFilePath) {
    return {
      kind: "unavailable",
      reason: "missing_file",
    };
  }

  const fileName = getStoredFileName(sourceFilePath);
  const previewKind = getFloorPlanPreviewKind(sourceFilePath);

  if (previewKind === "unsupported_file_type") {
    return {
      fileName,
      kind: "unavailable",
      reason: "unsupported_file_type",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .createSignedUrl(sourceFilePath, FLOOR_PLAN_PREVIEW_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.error("Floor plan preview signing failed", error);

      return {
        fileName,
        kind: "unavailable",
        reason: "signing_failed",
      };
    }

    return {
      expiresInSeconds: FLOOR_PLAN_PREVIEW_URL_TTL_SECONDS,
      fileName,
      kind: previewKind,
      url: data.signedUrl,
    };
  } catch (error) {
    console.error("Floor plan preview signing failed", error);

    return {
      fileName,
      kind: "unavailable",
      reason: "signing_failed",
    };
  }
}

type UploadFloorPlanInput = {
  projectId: string;
  userId: string;
  file: File;
};

export async function uploadFloorPlan({
  projectId,
  userId,
  file,
}: UploadFloorPlanInput): Promise<UploadFloorPlanResponse> {
  const fileValidationError = validateFloorPlanFile(file);

  if (fileValidationError) {
    return {
      ok: false,
      error: fileValidationError,
    };
  }

  if (!isAllowedFloorPlanMimeType(file.type)) {
    return {
      ok: false,
      error: {
        code: "unsupported_file_type",
        message: "Upload a PDF, PNG, JPG, or JPEG floor plan.",
      },
    };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
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

  const extension = getFloorPlanFileExtension(file.type);
  const filePath = `projects/${projectId}/floor-plan.${extension}`;
  const supabase = createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Floor plan upload failed", uploadError);

    return {
      ok: false,
      error: {
        code: "upload_failed",
        message: "Unable to upload floor plan.",
      },
    };
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      sourceFilePath: filePath,
      previewPath: null,
      status: "uploaded",
    },
  });

  return {
    ok: true,
    success: true,
    filePath,
    project: mapProject(updatedProject),
  };
}

export const listProjects = getUserProjects;
