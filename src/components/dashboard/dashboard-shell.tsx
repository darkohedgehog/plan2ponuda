"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  dashboardNavigationItems,
  getDashboardPageHeader,
  isDashboardNavigationItemActive,
  type DashboardIconName,
} from "@/components/dashboard/dashboard-navigation";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { Link, usePathname } from "@/i18n/navigation";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/helpers";

type DashboardShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const tDashboard = useTranslations("Dashboard");
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pageHeader = getDashboardPageHeader(pathname);
  const pageTitle = tDashboard(`headers.${pageHeader.id}.title`);
  const pageSubtitle = tDashboard(`headers.${pageHeader.id}.subtitle`);

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <DashboardSidebar
        onNavigate={closeMobileSidebar}
        pathname={pathname}
        variant="desktop"
      />

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={tDashboard("closeNavigation")}
            className="absolute inset-0 bg-slate-950/40"
            onClick={closeMobileSidebar}
            type="button"
          />
          <DashboardSidebar
            onNavigate={closeMobileSidebar}
            pathname={pathname}
            variant="mobile"
          />
        </div>
      ) : null}

      <div className="lg:pl-72">
        <DashboardTopbar
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          subtitle={pageSubtitle}
          title={pageTitle}
          user={user}
        />
        <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

type DashboardSidebarProps = {
  onNavigate: () => void;
  pathname: string;
  variant: "desktop" | "mobile";
};

function DashboardSidebar({
  onNavigate,
  pathname,
  variant,
}: DashboardSidebarProps) {
  const tCommon = useTranslations("Common");
  const tDashboard = useTranslations("Dashboard");
  const tNavigation = useTranslations("Navigation");

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col border-r border-slate-200 bg-white",
        variant === "desktop" && "fixed inset-y-0 left-0 hidden lg:flex",
        variant === "mobile" &&
          "relative z-10 shadow-2xl transition-transform lg:hidden",
      )}
    >
      <div className="mb-4 flex h-20 items-center gap-3 px-5">
        <Link
          className="flex items-center gap-3 rounded-md text-base font-semibold text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
          href="/dashboard"
          onClick={onNavigate}
        >
          <Image
            alt={tCommon("logoAlt")}
            className="h-auto w-auto"
            height={55}
            priority
            src="/logo.png"
            width={70}
          />
        </Link>
      </div>

      <nav aria-label={tDashboard("navigation")} className="flex-1 px-3 py-5">
        <div className="grid gap-1">
          {dashboardNavigationItems.map((item) => {
            const isActive = isDashboardNavigationItemActive(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-100",
                  isActive
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
                href={item.href}
                key={item.href}
                onClick={onNavigate}
              >
                <DashboardIcon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-blue-700" : "text-slate-400",
                  )}
                  name={item.icon}
                />
                {tNavigation(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">
            {tDashboard("workspace")}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {tDashboard("workspaceDescription")}
          </p>
        </div>
      </div>
    </aside>
  );
}

type DashboardTopbarProps = {
  onOpenSidebar: () => void;
  subtitle: string;
  title: string;
  user: AuthenticatedUser;
};

function DashboardTopbar({
  onOpenSidebar,
  subtitle,
  title,
  user,
}: DashboardTopbarProps) {
  const tDashboard = useTranslations("Dashboard");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label={tDashboard("openNavigation")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 lg:hidden"
            onClick={onOpenSidebar}
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
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-950 sm:text-xl">
              {title}
            </h1>
            <p className="hidden truncate text-sm text-slate-500 sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher />
          <UserAccountSummary user={user} />
        </div>
      </div>
    </header>
  );
}

type UserAccountSummaryProps = {
  user: AuthenticatedUser;
};

function UserAccountSummary({ user }: UserAccountSummaryProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tDashboard = useTranslations("Dashboard");
  const displayName = user.name || user.email;
  const initials = getUserInitials(displayName);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({
      callbackUrl: `/${locale}/sign-in`,
    });
  }

  return (
    <div
      aria-label={tDashboard("account")}
      className="flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm sm:gap-3"
      role="group"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
          {initials}
        </span>
        <div className="hidden min-w-0 sm:block">
          <p className="max-w-40 truncate text-sm font-medium text-slate-950">
            {displayName}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      <button
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? tActions("signingOut") : tActions("signOut")}
      </button>
    </div>
  );
}

function getUserInitials(value: string): string {
  const [firstPart, secondPart] = value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return `${firstPart?.[0] ?? "U"}${secondPart?.[0] ?? ""}`.toUpperCase();
}

type DashboardIconProps = {
  className?: string;
  name: DashboardIconName;
};

function DashboardIcon({ className, name }: DashboardIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {name === "dashboard" ? (
        <>
          <path d="M4 13h6V4H4z" />
          <path d="M14 20h6V4h-6z" />
          <path d="M4 20h6v-3H4z" />
        </>
      ) : null}
      {name === "folder" ? (
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      ) : null}
      {name === "materials" ? (
        <>
          <path d="M4 7h16" />
          <path d="M6 7v12" />
          <path d="M18 7v12" />
          <path d="M8 11h8" />
          <path d="M8 15h8" />
        </>
      ) : null}
      {name === "quotes" ? (
        <>
          <path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-2-1.4V6a2 2 0 0 1 2-2z" />
          <path d="M9 9h6" />
          <path d="M9 13h6" />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-2.1.3l-.2.2H11l-.2-.2a1.8 1.8 0 0 0-2.1-.3l-.2.1-2-3.4.1-.1a1.8 1.8 0 0 0 .3-2L6.8 15 5 14v-4l1.8-1 .1-.2a1.8 1.8 0 0 0-.3-2l-.1-.1 2-3.4.2.1a1.8 1.8 0 0 0 2.1-.3L11 3h4l.2.2a1.8 1.8 0 0 0 2.1.3l.2-.1 2 3.4-.1.1a1.8 1.8 0 0 0-.3 2l.1.2L21 10v4l-1.8 1z" />
        </>
      ) : null}
    </svg>
  );
}
