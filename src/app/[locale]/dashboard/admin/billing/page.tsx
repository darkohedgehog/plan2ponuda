import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminBillingPage() {
  await requireAdmin();

  const tAdmin = await getTranslations("Admin");

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-deep-twilight-950 text-turquoise-surf-300">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-bright-teal-blue-700">
              {tAdmin("billing.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-deep-twilight-950">
              {tAdmin("billing.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-deep-twilight-700">
              {tAdmin("billing.description")}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-frosted-blue-300 bg-white p-6 text-sm leading-6 text-deep-twilight-700 shadow-sm">
        {tAdmin("billing.placeholder")}
      </section>
    </main>
  );
}
