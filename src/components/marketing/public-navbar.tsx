"use client";

import { Menu, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/helpers";

const navigationLinks = [
  { href: "/#features", labelKey: "features" },
  { href: "/#how-it-works", labelKey: "howItWorks" },
  { href: "/pricing", labelKey: "pricing" },
] as const;

const navLinkClass =
  "text-sm font-medium text-deep-twilight-700 transition-colors hover:text-deep-twilight-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100";

const actionLinkClass =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2";

type PublicNavbarProps = {
  isAuthenticated: boolean;
};

export function PublicNavbar({ isAuthenticated }: PublicNavbarProps) {
  const tActions = useTranslations("Actions");
  const tAuth = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const tNavigation = useTranslations("Navigation");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const signInHref = isAuthenticated ? "/dashboard" : "/sign-in";
  const signInLabel = isAuthenticated
    ? tNavigation("dashboard")
    : tAuth("signIn");
  const startProjectHref = isAuthenticated
    ? "/dashboard/projects/new"
    : "/sign-up";

  function closeMenu() {
    setIsOpen(false);
  }

  function getNavLinkClass(href: string): string {
    const isActive = !href.startsWith("/#") && pathname === href;

    return cn(
      navLinkClass,
      isActive ? "text-deep-twilight-950" : "text-deep-twilight-700",
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-frosted-blue-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto mb-3 flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link className="flex items-center" href="/" onClick={closeMenu}>
          <Image
            alt={tCommon("logoAlt")}
            className="h-auto w-auto"
            height={55}
            priority
            src="/logo.png"
            width={70}
          />
        </Link>

        <nav
          aria-label={tNavigation("primaryNavigation")}
          className="hidden items-center gap-8 md:flex"
        >
          {navigationLinks.map((link) => (
            <Link
              className={getNavLinkClass(link.href)}
              href={link.href}
              key={link.href}
            >
              {tNavigation(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link
            className={cn(
              actionLinkClass,
              "shadow-none text-deep-twilight-800 hover:bg-frosted-blue-100 hover:text-deep-twilight-950",
            )}
            href={signInHref}
          >
            {signInLabel}
          </Link>
          <Link
            className={cn(
              actionLinkClass,
              "gap-2 bg-deep-twilight-600 text-white shadow-sm hover:bg-deep-twilight-700",
            )}
            href={startProjectHref}
          >
            <Zap aria-hidden="true" className="h-4 w-4" />
            {tActions("startProject")}
          </Link>
        </div>

        <button
          aria-expanded={isOpen}
          aria-label={tNavigation("toggleNavigationMenu")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-frosted-blue-200 bg-white text-deep-twilight-800 shadow-sm outline-none transition-colors hover:bg-frosted-blue-100 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 md:hidden"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          type="button"
        >
          {isOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-frosted-blue-200 bg-white px-5 py-4 shadow-sm md:hidden">
          <nav
            aria-label={tNavigation("mobileNavigation")}
            className="mx-auto flex max-w-7xl flex-col gap-3"
          >
            {navigationLinks.map((link) => (
              <Link
                className={cn(
                  "rounded-md px-2 py-2 hover:bg-frosted-blue-100 hover:text-deep-twilight-950",
                  getNavLinkClass(link.href),
                )}
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {tNavigation(link.labelKey)}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-frosted-blue-200 pt-4">
              <LocaleSwitcher className="justify-center" />
              <Link
                className={cn(
                  actionLinkClass,
                  "border border-frosted-blue-200 bg-white text-deep-twilight-800 hover:bg-frosted-blue-100",
                )}
                href={signInHref}
                onClick={closeMenu}
              >
                {signInLabel}
              </Link>
              <Link
                className={cn(
                  actionLinkClass,
                  "gap-2 bg-deep-twilight-600 text-white shadow-sm hover:bg-deep-twilight-700",
                )}
                href={startProjectHref}
                onClick={closeMenu}
              >
                <Zap aria-hidden="true" className="h-4 w-4" />
                {tActions("startProject")}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
