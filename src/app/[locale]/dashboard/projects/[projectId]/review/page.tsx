import { notFound } from "next/navigation";

import { RoomReview } from "@/components/analysis/room-review";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectRoomsForReview } from "@/server/services/analysis-service";
import {
  createSignedFloorPlanUrl,
  getProjectById,
} from "@/server/services/project-service";

type ProjectReviewPageProps = {
  params: Promise<{
    locale: string;
    projectId: string;
  }>;
};

export default async function ProjectReviewPage({
  params,
}: ProjectReviewPageProps) {
  const { locale: rawLocale, projectId } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
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
