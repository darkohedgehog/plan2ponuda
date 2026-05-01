import { redirect } from "next/navigation";

import { MaterialCatalog } from "@/components/materials/material-catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { getMaterialCatalog } from "@/server/services/material-service";

export default async function MaterialsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const materials = await getMaterialCatalog();

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-blue-700">Materials catalog</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Materials
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review the persisted catalog records used by generated project quotes.
        </p>
      </section>

      <MaterialCatalog materials={materials} />
    </main>
  );
}
