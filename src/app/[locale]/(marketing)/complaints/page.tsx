import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { resolveLocale } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

const complaintsSectionKeys = [
  "emailProcess",
  "requiredInfo",
  "deadline",
  "pendingInvoice",
  "legalReview",
] as const;

type ComplaintsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: ComplaintsPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const tMetadata = await getTranslations({
    locale,
    namespace: "Complaints.metadata",
  });

  return buildPublicPageMetadata({
    description: tMetadata("description"),
    locale,
    slug: "complaints",
    title: tMetadata("title"),
  });
}

export default function ComplaintsPage() {
  // TODO: Legal review required before production launch to confirm written complaint wording and consumer-law references.
  return (
    <LegalPageContent
      namespace="Complaints"
      sectionKeys={complaintsSectionKeys}
    />
  );
}
