import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketingHomepage } from "@/components/marketing/marketing-homepage";
import { resolveLocale } from "@/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/session";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type MarketingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: MarketingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const tMetadata = await getTranslations({
    locale,
    namespace: "Marketing.metadata",
  });

  return buildPublicPageMetadata({
    description: tMetadata("description"),
    locale,
    slug: "",
    title: tMetadata("title"),
  });
}

export default async function MarketingPage() {
  const user = await getOptionalCurrentUser();

  return <MarketingHomepage isAuthenticated={Boolean(user)} />;
}
