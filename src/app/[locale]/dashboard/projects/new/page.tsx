import { getTranslations } from "next-intl/server";

import { CreateProjectForm } from "@/components/projects/create-project-form";

export default async function NewProjectPage() {
  const tHeader = await getTranslations("Dashboard.headers.newProject");

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-3xl font-semibold text-deep-twilight-950">
          {tHeader("title")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
          {tHeader("subtitle")}
        </p>
      </section>
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <CreateProjectForm />
      </section>
    </main>
  );
}
