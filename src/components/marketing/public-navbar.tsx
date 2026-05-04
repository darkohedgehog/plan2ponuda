"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils/helpers";
import Image from "next/image";

const navigationLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

const navLinkClass =
  "text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100";

const actionLinkClass =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2";

type PublicNavbarProps = {
  isAuthenticated: boolean;
};

export function PublicNavbar({ isAuthenticated }: PublicNavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const signInHref = isAuthenticated ? "/dashboard" : "/sign-in";
  const signInLabel = isAuthenticated ? "Dashboard" : "Sign in";
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
      isActive ? "text-slate-950" : "text-slate-600",
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8 mb-3">
        <Link
          className="flex items-center"
          href="/"
          onClick={closeMenu}
        >
          <Image              
            alt="PloroAi logo"
            src="/logo.png"
            width={70}
            height={55}
            priority
            className="h-auto w-auto"
          />
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
          {navigationLinks.map((link) => (
            <Link
              className={getNavLinkClass(link.href)}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            className={cn(
              actionLinkClass,
              "shadow-none text-slate-700 hover:bg-slate-100 hover:text-slate-950",
            )}
            href={signInHref}
          >
            {signInLabel}
          </Link>
          <Link
            className={cn(
              actionLinkClass,
              "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
            )}
            href={startProjectHref}
          >
            Start Project
          </Link>
        </div>

        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 md:hidden"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-sm md:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-3">
            {navigationLinks.map((link) => (
              <Link
                className={cn(
                  "rounded-md px-2 py-2 hover:bg-slate-100 hover:text-slate-950",
                  getNavLinkClass(link.href),
                )}
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-slate-200 pt-4">
              <Link
                className={cn(
                  actionLinkClass,
                  "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                )}
                href={signInHref}
                onClick={closeMenu}
              >
                {signInLabel}
              </Link>
              <Link
                className={cn(
                  actionLinkClass,
                  "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
                )}
                href={startProjectHref}
                onClick={closeMenu}
              >
                Start Project
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
