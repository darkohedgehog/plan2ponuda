import { notFound, redirect } from "next/navigation";

import { RoomReview } from "@/components/analysis/room-review";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectRoomsForReview } from "@/server/services/analysis-service";
import {
  createSignedFloorPlanUrl,
  getProjectById,
} from "@/server/services/project-service";

type ProjectReviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectReviewPage({
  params,
}: ProjectReviewPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const project = await getProjectById(projectId, user.id);

  if (!project) {
    notFound();
  }

  const [floorPlanPreview, rooms] = await Promise.all([
    createSignedFloorPlanUrl(project.sourceFilePath),
    getProjectRoomsForReview(project.id, user.id),
  ]);

  return (
    <RoomReview
      floorPlanPreview={floorPlanPreview}
      project={{
        id: project.id,
        name: project.name,
        status: project.status,
      }}
      rooms={rooms}
    />
  );
}
