import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { resolveLocale } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

const termsSectionKeys = [
  "provider",
  "service",
  "account",
  "aiDisclaimer",
  "subscriptions",
  "usageLimits",
  "uploadedContent",
  "proBeta",
  "termination",
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

  return buildPublicPageMetadata({
    description: tMetadata("description"),
    locale,
    slug: "terms",
    title: tMetadata("title"),
  });
}

export default function TermsPage() {
  // TODO: Legal/accounting review required before production launch, especially liability, consumer terms, invoices, refunds, and governing law.
  return <LegalPageContent namespace="Terms" sectionKeys={termsSectionKeys} />;
}
