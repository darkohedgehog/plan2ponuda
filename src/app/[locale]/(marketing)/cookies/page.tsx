import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { resolveLocale } from "@/i18n/routing";

const cookiesSectionKeys = [
  "essential",
  "stripe",
  "analytics",
  "control",
] as const;

type CookiesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: CookiesPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const tMetadata = await getTranslations({
    locale,
    namespace: "Cookies.metadata",
  });

  return {
    description: tMetadata("description"),
    title: tMetadata("title"),
  };
}

export default function CookiesPage() {
  // TODO: Confirm final cookie wording with legal review before production launch.
  return <LegalPageContent namespace="Cookies" sectionKeys={cookiesSectionKeys} />;
}
