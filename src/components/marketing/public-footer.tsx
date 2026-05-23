import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const footerLinks = [
  { href: "/#features", labelKey: "features" },
  { href: "/pricing", labelKey: "pricing" },
  { href: "/terms", labelKey: "terms" },
  { href: "/privacy", labelKey: "privacy" },
  { href: "/cookies", labelKey: "cookies" },
  { href: "/contact", labelKey: "contact" },
] as const;

export function PublicFooter() {
  const tCommon = useTranslations("Common");
  const tFooter = useTranslations("Footer");
  const tNavigation = useTranslations("Navigation");

  return (
    <footer className="border-t border-frosted-blue-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Link className="text-base font-semibold text-deep-twilight-950" href="/">
            {tCommon("appName")}
          </Link>
          <p className="mt-2 text-sm text-deep-twilight-700/70">
            {tFooter("tagline")}
          </p>
        </div>
        <nav
          aria-label={tNavigation("footerNavigation")}
          className="flex flex-wrap gap-5"
        >
          {footerLinks.map((link) => (
            <Link
              className="rounded-md text-sm font-medium text-deep-twilight-700/70 outline-none transition-colors hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100"
              href={link.href}
              key={link.href}
            >
              {tNavigation(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
