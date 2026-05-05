import { CreateProjectForm } from "@/components/projects/create-project-form";

export default function NewProjectPage() {
  return (
    <main className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-semibold">New project</h1>
      <p className="text-slate-600">
        Create a project container before uploading a floor plan.
      </p>
      <CreateProjectForm />
    </main>
  );
}
