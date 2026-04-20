import { RoomReview } from "@/components/analysis/room-review";

type ProjectReviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectReviewPage({
  params,
}: ProjectReviewPageProps) {
  const { projectId } = await params;

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Review {projectId}</h1>
      <RoomReview title="Detected rooms" />
    </main>
  );
}
