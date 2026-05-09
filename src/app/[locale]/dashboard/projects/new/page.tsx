import { getTranslations } from "next-intl/server";

import { CreateProjectForm } from "@/components/projects/create-project-form";

export default async function NewProjectPage() {
  const tHeader = await getTranslations("Dashboard.headers.newProject");

  return (
    <main className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-semibold">{tHeader("title")}</h1>
      <p className="text-slate-600">{tHeader("subtitle")}</p>
      <CreateProjectForm />
    </main>
  );
}
