import { notFound } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSettings } from "@/server/services/settings-service";

type SettingsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const settings = await getUserSettings(user.id);

  if (!settings) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Workspace setup</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Settings
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage profile details, company information, and estimating defaults
          used when generating quotes.
        </p>
      </section>

      <SettingsForm initialSettings={settings} />
    </main>
  );
}
