import { ProjectCard } from "@/components/projects/project-card";

export default function ProjectsPage() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Projects</h1>
      <ProjectCard name="Sample apartment plan" status="Awaiting review" />
    </main>
  );
}
