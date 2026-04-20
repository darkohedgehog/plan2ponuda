import { ProjectStatus as PrismaProjectStatus, type Project as DbProject } from "@prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import type { CreateProjectInput } from "@/lib/validations/project.schema";
import type { Project, ProjectStatus } from "@/types/project";

function mapProjectStatus(status: PrismaProjectStatus): ProjectStatus {
  switch (status) {
    case PrismaProjectStatus.DRAFT:
      return "draft";
    case PrismaProjectStatus.ANALYZING:
      return "analyzing";
    case PrismaProjectStatus.REVIEW:
      return "review";
    case PrismaProjectStatus.QUOTED:
      return "quoted";
  }
}

function mapProject(project: DbProject): Project {
  return {
    id: project.id,
    name: project.name,
    status: mapProjectStatus(project.status),
    planFileKey: project.planFileKey ?? undefined,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  const prisma = getPrismaClient();
  const projects = await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });

  return projects.map(mapProject);
}

export async function createProject(
  input: CreateProjectInput,
  ownerId: string,
): Promise<Project> {
  const prisma = getPrismaClient();
  const project = await prisma.project.create({
    data: {
      name: input.name,
      ownerId,
      planFileKey: input.planFileKey,
    },
  });

  return mapProject(project);
}

export async function getProjectById(
  projectId: string,
  ownerId: string,
): Promise<Project | null> {
  const prisma = getPrismaClient();
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId,
    },
  });

  return project ? mapProject(project) : null;
}
