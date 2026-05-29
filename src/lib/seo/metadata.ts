import type { Metadata } from "next";

import { defaultLocale, locales, type Locale } from "@/i18n/routing";

const LOCAL_SITE_URL = "http://localhost:3000";

const openGraphLocales = {
  de: "de_DE",
  en: "en_US",
  hr: "hr_HR",
  sl: "sl_SI",
  sr: "sr_RS",
} satisfies Record<Locale, string>;

export type PublicPageSlug =
  | ""
  | "pricing"
  | "privacy"
  | "terms"
  | "cookies"
  | "complaints"
  | "contact";

type PublicPageMetadataInput = {
  description: string;
  locale: Locale;
  slug: PublicPageSlug;
  title: string;
};

function normalizeSiteUrl(value: string): string {
  const parsedUrl = new URL(value);

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  return parsedUrl.origin;
}

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return normalizeSiteUrl(configuredUrl);
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_SITE_URL;
  }

  throw new Error("NEXT_PUBLIC_SITE_URL must be set to an absolute URL.");
}

export function getLocalizedPublicPath(
  locale: Locale,
  slug: PublicPageSlug,
): string {
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

function getAbsoluteUrl(path: string, siteUrl: string): string {
  return new URL(path, siteUrl).toString();
}

function getLanguageAlternates(
  slug: PublicPageSlug,
  siteUrl: string,
): Record<string, string> {
  const languageAlternates = Object.fromEntries(
    locales.map((locale) => [
      locale,
      getAbsoluteUrl(getLocalizedPublicPath(locale, slug), siteUrl),
    ]),
  );

  return {
    ...languageAlternates,
    "x-default": getAbsoluteUrl(
      getLocalizedPublicPath(defaultLocale, slug),
      siteUrl,
    ),
  };
}

export function buildPublicPageMetadata({
  description,
  locale,
  slug,
  title,
}: PublicPageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = getLocalizedPublicPath(locale, slug);
  const canonicalUrl = getAbsoluteUrl(canonicalPath, siteUrl);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(slug, siteUrl),
    },
    openGraph: {
      title,
      description,
      locale: openGraphLocales[locale],
      alternateLocale: locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => openGraphLocales[alternateLocale]),
      siteName: "Ploro AI",
      type: "website",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
