import type { ProjectStatus } from "@/types/project";

export type QuoteWorkspaceMaterialState =
  | "generate_initial_materials"
  | "load_existing_materials"
  | "needs_room_review";

type QuoteWorkspaceMaterialStateInput = {
  projectMaterialCount: number;
  projectStatus: ProjectStatus;
  roomCount: number;
};

export function getQuoteWorkspaceMaterialState({
  projectMaterialCount,
  projectStatus,
  roomCount,
}: QuoteWorkspaceMaterialStateInput): QuoteWorkspaceMaterialState {
  if (projectMaterialCount > 0) {
    return "load_existing_materials";
  }

  if (roomCount === 0) {
    return "needs_room_review";
  }

  if (projectStatus === "reviewed") {
    return "generate_initial_materials";
  }

  return projectStatus === "quoted"
    ? "load_existing_materials"
    : "needs_room_review";
}
