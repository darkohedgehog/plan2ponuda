import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";

export const locales = ["hr", "sr", "en", "de", "sl"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "hr";

export const localeLabels: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  hr: "Hrvatski",
  sl: "Slovenščina",
  sr: "Srpski",
};

export const routing = defineRouting({
  defaultLocale,
  localeDetection: true,
  localePrefix: "always",
  locales,
});

export function resolveLocale(value: string | undefined): Locale {
  return hasLocale(locales, value) ? value : defaultLocale;
}
