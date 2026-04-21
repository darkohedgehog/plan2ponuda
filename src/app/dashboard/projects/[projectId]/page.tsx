import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FloorPlanUploadForm } from "@/components/projects/floor-plan-upload-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectById } from "@/server/services/project-service";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const project = await getProjectById(projectId, user.id);

  if (!project) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-slate-600">{project.status}</p>
        <h1 className="text-3xl font-semibold">{project.name}</h1>
      </div>

      <section className="grid gap-3 rounded-lg border border-border bg-white p-4 text-sm text-slate-700 sm:grid-cols-2">
        <p>Client: {project.clientName ?? "Not set"}</p>
        <p>Object type: {project.objectType}</p>
        <p>Area: {project.areaM2} m2</p>
        <p>Source file: {project.sourceFilePath ?? "Not uploaded"}</p>
      </section>

      <section className="rounded-lg border border-border bg-white p-4">
        <h2 className="text-lg font-semibold">Floor plan</h2>
        {project.sourceFilePath ? (
          <p className="mt-2 text-sm text-slate-600">
            Uploaded file: {project.sourceFilePath}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Upload a PDF, PNG, JPG, or JPEG file up to 10MB.
          </p>
        )}
        <FloorPlanUploadForm projectId={project.id} />
      </section>

      <section className="rounded-lg border border-border bg-white p-4">
        <h2 className="text-lg font-semibold">Analysis</h2>
        <p className="mt-2 text-sm text-slate-600">
          Analysis status and room suggestions will appear here after upload.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            className="text-sm font-medium text-blue-700"
            href={`/dashboard/projects/${project.id}/review`}
          >
            Review rooms
          </Link>
          <Link
            className="text-sm font-medium text-blue-700"
            href={`/dashboard/projects/${project.id}/quote`}
          >
            Quote
          </Link>
        </div>
      </section>
    </main>
  );
}
