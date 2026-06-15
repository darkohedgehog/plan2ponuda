import "server-only";

import type { Project as DbProject } from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import {
  validateFloorPlanFileUpload,
  type CreateProjectInput,
} from "@/lib/validations/project.schema";
import type {
  FloorPlanPreview,
  Project,
  UploadFloorPlanResponse,
} from "@/types/project";
import {
  consumeUsageOrThrow,
  UsageLimitExceededError,
} from "@/server/services/billing-service";
import { shouldCountFloorPlanUpload } from "@/server/services/usage-limit-policy";
import {
  assertProjectOwnedStoragePath,
  getProjectStoragePathsToDelete,
  isProjectOwnedStoragePath,
} from "./project-storage-paths";

const PROJECT_FILES_BUCKET = "project-files";
const FLOOR_PLAN_PREVIEW_URL_TTL_SECONDS = 5 * 60;

type ProjectUploadWriteClient = Pick<
  typeof prisma,
  "$queryRaw" | "project" | "subscription" | "usageCounter"
>;

type LockedProjectUploadRow = {
  id: string;
  sourceFilePath: string | null;
};

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
      sourceFilePath: null,
      previewPath: null,
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

export type DeleteProjectResult =
  | {
      ok: true;
      projectId: string;
    }
  | {
      ok: false;
      reason: "not_found";
    };

export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<DeleteProjectResult> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      documents: {
        select: {
          filePath: true,
        },
      },
      id: true,
      previewPath: true,
      sourceFilePath: true,
    },
  });

  if (!project) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  const storagePaths = getProjectStoragePathsToDelete({
    documentFilePaths: project.documents.map((document) => document.filePath),
    previewPath: project.previewPath,
    projectId: project.id,
    sourceFilePath: project.sourceFilePath,
  });

  const deletedProject = await prisma.project
    .delete({
      where: {
        id: project.id,
      },
      select: {
        id: true,
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

  if (!deletedProject) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  await removeProjectStorageFiles(storagePaths);

  return {
    ok: true,
    projectId: deletedProject.id,
  };
}

export type ProjectWorkspaceData = Project & {
  hasMaterials: boolean;
  hasQuote: boolean;
  hasRooms: boolean;
};

export async function getProjectWorkspaceData(
  projectId: string,
  userId: string,
): Promise<ProjectWorkspaceData | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      _count: {
        select: {
          materials: true,
          rooms: true,
        },
      },
      quote: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  return {
    ...mapProject(project),
    hasMaterials: project._count.materials > 0,
    hasQuote: Boolean(project.quote),
    hasRooms: project._count.rooms > 0,
  };
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
  projectId: string,
  sourceFilePath?: string,
): Promise<FloorPlanPreview> {
  if (!sourceFilePath) {
    return {
      kind: "unavailable",
      reason: "missing_file",
    };
  }

  if (!isProjectOwnedStoragePath(projectId, sourceFilePath)) {
    warnInvalidStoredProjectPath("preview", projectId);

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

function warnInvalidStoredProjectPath(context: string, projectId: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Ignored invalid project storage path", {
      context,
      projectId,
    });
  }
}

async function removeProjectStorageFiles(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) {
    return;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error("Project storage cleanup failed", error);
    }
  } catch (error) {
    console.error("Project storage cleanup failed", error);
  }
}

async function removeReplacedFloorPlanFile(
  projectId: string,
  previousSourceFilePath: string | null,
  nextSourceFilePath: string,
): Promise<void> {
  if (!previousSourceFilePath || previousSourceFilePath === nextSourceFilePath) {
    return;
  }

  if (!isProjectOwnedStoragePath(projectId, previousSourceFilePath)) {
    warnInvalidStoredProjectPath("replacement_cleanup", projectId);

    return;
  }

  await removeProjectStorageFiles([previousSourceFilePath]);
}

async function findAndLockProjectForFloorPlanUpload(
  db: ProjectUploadWriteClient,
  projectId: string,
  userId: string,
): Promise<LockedProjectUploadRow | null> {
  const rows = await db.$queryRaw<LockedProjectUploadRow[]>`
    SELECT id, "sourceFilePath"
    FROM "Project"
    WHERE id = ${projectId} AND "userId" = ${userId}
    FOR UPDATE
  `;

  return rows[0] ?? null;
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
  const validatedFile = await validateFloorPlanFileUpload(file);

  if (!validatedFile.ok) {
    return {
      ok: false,
      error: validatedFile.error,
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

  const extension = validatedFile.extension;
  const filePath = assertProjectOwnedStoragePath(
    project.id,
    `projects/${project.id}/floor-plan.${extension}`,
  );
  const supabase = createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(filePath, file, {
      contentType: validatedFile.mimeType,
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

  const updateResult = await prisma
    .$transaction(async (transaction) => {
      const currentProject = await findAndLockProjectForFloorPlanUpload(
        transaction,
        project.id,
        userId,
      );

      if (!currentProject) {
        return {
          ok: false as const,
          reason: "not_found" as const,
        };
      }

      const hasCurrentProjectOwnedFloorPlan = isProjectOwnedStoragePath(
        project.id,
        currentProject.sourceFilePath,
      );

      if (
        shouldCountFloorPlanUpload(
          hasCurrentProjectOwnedFloorPlan
            ? currentProject.sourceFilePath
            : null,
        )
      ) {
        await consumeUsageOrThrow(
          transaction,
          userId,
          "floor_plans_created",
        );
      }

      const nextProject = await transaction.project.update({
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
        ok: true as const,
        previousSourceFilePath: currentProject.sourceFilePath,
        project: nextProject,
      };
    })
    .catch(async (error: unknown) => {
      await removeProjectStorageFiles([filePath]);

      if (error instanceof UsageLimitExceededError) {
        return {
          ok: false as const,
          reason: "floor_plan_limit_reached" as const,
        };
      }

      throw error;
    });

  if (!updateResult.ok && updateResult.reason === "not_found") {
    await removeProjectStorageFiles([filePath]);

    return {
      ok: false,
      error: {
        code: "not_found",
        message: "Project not found.",
      },
    };
  }

  if (!updateResult.ok) {
    return {
      ok: false,
      error: {
        code: "floor_plan_limit_reached",
        message: "You have reached your floor plan limit for this plan.",
      },
    };
  }

  await removeReplacedFloorPlanFile(
    project.id,
    updateResult.previousSourceFilePath,
    filePath,
  );

  return {
    ok: true,
    success: true,
    filePath,
    project: mapProject(updateResult.project),
  };
}

export const listProjects = getUserProjects;
