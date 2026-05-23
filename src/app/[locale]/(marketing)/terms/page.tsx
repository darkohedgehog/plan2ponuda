import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { resolveLocale } from "@/i18n/routing";

const termsSectionKeys = [
  "serviceUse",
  "aiReview",
  "notEngineering",
  "userResponsibility",
  "subscriptions",
  "misuse",
  "disclaimer",
  "governingLaw",
] as const;

type TermsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const tMetadata = await getTranslations({
    locale,
    namespace: "Terms.metadata",
  });

  return {
    description: tMetadata("description"),
    title: tMetadata("title"),
  };
}

export default function TermsPage() {
  // TODO: Replace this release-prep placeholder with lawyer/accountant-reviewed terms before production launch.
  return <LegalPageContent namespace="Terms" sectionKeys={termsSectionKeys} />;
}
