import { ShieldCheck, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { CookieSettingsButton } from "@/components/marketing/cookie-settings-button";
import { Link } from "@/i18n/navigation";

const productLinks = [
  { href: "/#features", labelKey: "features" },
  { href: "/pricing", labelKey: "pricing" },
  { href: "/contact", labelKey: "contact" },
] as const;

const legalLinks = [
  { href: "/terms", labelKey: "terms" },
  { href: "/privacy", labelKey: "privacy" },
  { href: "/cookies", labelKey: "cookies" },
  { href: "#cookie-settings", labelKey: "cookieSettings", isAction: true },
  { href: "/complaints", labelKey: "complaints" },
  { href: "/sitemap.xml", labelKey: "sitemap", isLocalized: false },
] as const;

const accountLinks = [
  { href: "/sign-in", labelKey: "signIn" },
  { href: "/sign-up", labelKey: "startProject" },
] as const;

const footerLinkClass =
  "rounded-md text-sm font-medium text-deep-twilight-100/74 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-bright-teal-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-twilight-950";

export function PublicFooter() {
  const tCommon = useTranslations("Common");
  const tCookieConsent = useTranslations("CookieConsent");
  const tFooter = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-deep-twilight-950 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,166,255,0.22),transparent_24rem),radial-gradient(circle_at_88%_12%,rgba(0,212,255,0.16),transparent_24rem),linear-gradient(180deg,#010223_0%,#020231_58%,#001724_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(rgba(102,229,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(102,229,255,0.18)_1px,transparent_1px)] bg-size-[38px_38px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-bright-teal-blue-400/70 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="min-w-0 max-w-xl">
            <Link
              className="inline-flex h-12 w-35.5 items-center overflow-hidden rounded-xl bg-white px-3 shadow-[0_18px_42px_rgba(0,166,255,0.18)] outline-none ring-1 ring-white/15 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-twilight-950"
              href="/"
            >
              <Image
                alt={tCommon("logoAlt")}
                className="h-16 w-24 object-contain"
                height={64}
                src="/logo-transparent.png"
                width={96}
              />
            </Link>
            <p className="mt-5 text-sm leading-6 text-deep-twilight-100/76">
              {tFooter("description")}
            </p>
            <div className="mt-6 flex min-w-0 gap-3 rounded-2xl border border-bright-teal-blue-300/20 bg-white/6 p-4 text-sm leading-6 text-deep-twilight-100/78 backdrop-blur">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-bright-teal-blue-300"
              />
              <p className="min-w-0">{tFooter("aiReviewNote")}</p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterLinkGroup
              links={productLinks}
              title={tFooter("product")}
              translateLabel={(labelKey) => tFooter(`links.${labelKey}`)}
            />
            <FooterLinkGroup
              links={legalLinks}
              title={tFooter("legal")}
              translateLabel={(labelKey) =>
                labelKey === "cookieSettings"
                  ? tCookieConsent("footer.cookieSettings")
                  : tFooter(`links.${labelKey}`)
              }
            />
            <FooterLinkGroup
              links={accountLinks}
              title={tFooter("account")}
              translateLabel={(labelKey) => tFooter(`links.${labelKey}`)}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-deep-twilight-100/62 sm:flex-row sm:items-center sm:justify-between">
          <p>{tFooter("copyright", { year })}</p>
          <Link
            className="inline-flex items-center gap-2 rounded-md font-semibold text-bright-teal-blue-300 outline-none transition-colors hover:text-turquoise-surf-300 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-twilight-950"
            href="/sign-up"
          >
            <Zap aria-hidden="true" className="h-4 w-4" />
            {tFooter("links.startProject")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = {
  href: string;
  isAction?: boolean;
  isLocalized?: boolean;
  labelKey: string;
};

type FooterLinkGroupProps<TLink extends FooterLink> = {
  links: readonly TLink[];
  title: string;
  translateLabel: (labelKey: TLink["labelKey"]) => string;
};

function FooterLinkGroup<TLink extends FooterLink>({
  links,
  title,
  translateLabel,
}: FooterLinkGroupProps<TLink>) {
  const tNavigation = useTranslations("Navigation");

  return (
    <nav
      aria-label={`${tNavigation("footerNavigation")} - ${title}`}
      className="min-w-0"
    >
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {links.map((link) => (
          <li className="min-w-0" key={link.href}>
            {link.isAction ? (
              <CookieSettingsButton className={footerLinkClass}>
                {translateLabel(link.labelKey)}
              </CookieSettingsButton>
            ) : link.isLocalized === false ? (
              <a className={footerLinkClass} href={link.href}>
                {translateLabel(link.labelKey)}
              </a>
            ) : (
              <Link className={footerLinkClass} href={link.href}>
                {translateLabel(link.labelKey)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
