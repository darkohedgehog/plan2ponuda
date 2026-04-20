type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Project {projectId}</h1>
      <p className="text-slate-600">
        Project detail placeholder for floor plan, rooms, and quote progress.
      </p>
    </main>
  );
}
