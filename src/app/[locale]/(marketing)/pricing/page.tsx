import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PricingPageContent } from "@/components/marketing/pricing-page-content";
import { resolveLocale } from "@/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/session";

type PricingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const tMetadata = await getTranslations({
    locale,
    namespace: "Pricing.metadata",
  });

  return {
    description: tMetadata("description"),
    title: tMetadata("title"),
  };
}

export default async function PricingPage() {
  const user = await getOptionalCurrentUser();

  return <PricingPageContent isAuthenticated={Boolean(user)} />;
}
