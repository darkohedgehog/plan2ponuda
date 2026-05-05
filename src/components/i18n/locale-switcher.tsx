"use client";

import { useLocale } from "next-intl";
import { type ChangeEvent, useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils/helpers";

type LocaleSwitcherProps = {
  className?: string;
};

function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;

    if (!isLocale(nextLocale) || nextLocale === locale) {
      return;
    }

    startTransition(() => {
      // TODO: Persist the selected locale in UserSettings once the schema supports it.
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <label className={cn("inline-flex shrink-0 items-center", className)}>
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onChange={handleLocaleChange}
        value={locale}
      >
        {locales.map((availableLocale) => (
          <option key={availableLocale} value={availableLocale}>
            {localeLabels[availableLocale]}
          </option>
        ))}
      </select>
    </label>
  );
}
