import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { routing } from "@/i18n/routing";

const GOOGLE_SITE_VERIFICATION = "XGgN0Lc6ektEZwIlkAk3S78s-FXU3HPnBc7bUKyfCPY";

type RootLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

type MetadataProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const tCommon = await getTranslations({ locale, namespace: "Common" });
  const tHero = await getTranslations({
    locale,
    namespace: "Marketing.hero",
  });

  return {
    description: tHero("description"),
    icons: {
      apple: "/icon/apple-touch-icon.png",
      icon: [
        {
          url: "/icon/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        {
          url: "/icon/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
      ],
    },
    manifest: "/manifest.webmanifest",
    verification: {
      google: GOOGLE_SITE_VERIFICATION,
    },
    title: `${tCommon("appName")} - ${tHero("title")}`,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
