import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContactPageContent } from "@/components/marketing/contact-page-content";
import { resolveLocale } from "@/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/session";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

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

  return buildPublicPageMetadata({
    description: tMetadata("description"),
    locale,
    slug: "contact",
    title: tMetadata("title"),
  });
}

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = await getOptionalCurrentUser();

  return <ContactPageContent isAuthenticated={Boolean(user)} />;
}
