import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { resolveLocale } from "@/i18n/routing";

const contactSectionKeys = ["support", "sales", "security"] as const;

type ContactPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const tMetadata = await getTranslations({
    locale,
    namespace: "Contact.metadata",
  });

  return {
    description: tMetadata("description"),
    title: tMetadata("title"),
  };
}

export default function ContactPage() {
  return <LegalPageContent namespace="Contact" sectionKeys={contactSectionKeys} />;
}
