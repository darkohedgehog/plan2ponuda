import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { resolveLocale } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

const privacySectionKeys = [
  "controller",
  "dataCollected",
  "purposes",
  "legalBases",
  "processors",
  "storage",
  "retention",
  "rights",
  "transfers",
  "privacyContact",
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

  return buildPublicPageMetadata({
    description: tMetadata("description"),
    locale,
    slug: "privacy",
    title: tMetadata("title"),
  });
}

export default function PrivacyPage() {
  // TODO: Legal review required before production launch. Also verify final Supabase/database/storage region and subprocessor list.
  return <LegalPageContent namespace="Privacy" sectionKeys={privacySectionKeys} />;
}
