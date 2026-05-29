import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DeleteAccountDangerZone } from "@/components/settings/delete-account-danger-zone";
import { SettingsForm } from "@/components/settings/settings-form";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountDeletionStatus } from "@/server/services/account-deletion-service";
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

  const [settings, accountDeletionStatus] = await Promise.all([
    getUserSettings(user.id),
    getAccountDeletionStatus(user.id),
  ]);
  const tSettings = await getTranslations("Settings");

  if (!settings || !accountDeletionStatus) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bright-teal-blue-700">
          {tSettings("page.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-deep-twilight-950">
          {tSettings("page.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-deep-twilight-700">
          {tSettings("page.description")}
        </p>
      </section>

      <SettingsForm initialSettings={settings} />
      <DeleteAccountDangerZone
        blockedReason={accountDeletionStatus.blockedReason}
        email={settings.email}
      />
    </main>
  );
}
