import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { resolveLocale } from "@/i18n/routing";

const privacySectionKeys = [
  "dataCollected",
  "accountData",
  "billingData",
  "uploads",
  "aiProcessing",
  "payments",
  "email",
  "providers",
  "rights",
] as const;

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const tMetadata = await getTranslations({
    locale,
    namespace: "Privacy.metadata",
  });

  return {
    description: tMetadata("description"),
    title: tMetadata("title"),
  };
}

export default function PrivacyPage() {
  // TODO: Replace this release-prep placeholder with lawyer-reviewed privacy text before production launch.
  return <LegalPageContent namespace="Privacy" sectionKeys={privacySectionKeys} />;
}
