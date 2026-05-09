"use client";

import {
  Bolt,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react";
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
    <div className="min-h-screen bg-frosted-blue-50 text-deep-twilight-950">
      <DashboardSidebar
        onNavigate={closeMobileSidebar}
        pathname={pathname}
        variant="desktop"
      />

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={tDashboard("closeNavigation")}
            className="absolute inset-0 bg-deep-twilight-950/60"
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
        "flex h-full w-72 flex-col border-r border-white/10 bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.20),transparent_18rem),linear-gradient(180deg,#010223_0%,#020231_100%)] text-white",
        variant === "desktop" && "fixed inset-y-0 left-0 hidden lg:flex",
        variant === "mobile" &&
          "relative z-10 shadow-2xl transition-transform lg:hidden",
      )}
    >
      <div className="mb-4 flex h-20 items-center gap-3 px-5">
        <Link
          className="flex items-center gap-3 rounded-md text-base font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-bright-teal-blue-300"
          href="/dashboard"
          onClick={onNavigate}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-turquoise-surf-300 shadow-sm">
            <Bolt aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="rounded-md bg-white/70 px-2 py-1 h-12 w-40 flex items-center justify-center">
            <Image
              alt={tCommon("logoAlt")}
              className="h-auto w-auto"
              height={55}
              priority
              src="/logo-transparent.png"
              width={70}
            />
          </span>
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
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-300",
                  isActive
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/15"
                    : "text-deep-twilight-100 hover:bg-white/10 hover:text-white",
                )}
                href={item.href}
                key={item.href}
                onClick={onNavigate}
              >
                <DashboardIcon
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-turquoise-surf-300"
                      : "text-deep-twilight-200",
                  )}
                  name={item.icon}
                />
                {tNavigation(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-md border border-white/10 bg-white/6 p-3 shadow-inner shadow-black/10">
          <p className="text-xs font-medium text-deep-twilight-100">
            {tDashboard("workspace")}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
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
    <header className="sticky top-0 z-30 border-b border-frosted-blue-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label={tDashboard("openNavigation")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-frosted-blue-200 bg-white text-deep-twilight-800 shadow-sm outline-none transition-colors hover:border-bright-teal-blue-200 hover:bg-frosted-blue-50 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 lg:hidden"
            onClick={onOpenSidebar}
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="hidden truncate text-2xl font-semibold text-deep-twilight-950 sm:block">
              {title}
            </h1>
            <p className="hidden truncate text-sm text-deep-twilight-700/70 sm:block">
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
      className="flex shrink-0 items-center gap-2 rounded-md border border-frosted-blue-200 bg-white/95 px-2.5 py-2 shadow-sm sm:gap-3"
      role="group"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-deep-twilight-950 text-xs font-semibold text-turquoise-surf-300">
          {initials}
        </span>
        <div className="hidden min-w-0 sm:block">
          <p className="max-w-40 truncate text-sm font-medium text-deep-twilight-950">
            {displayName}
          </p>
          <p className="truncate text-xs text-deep-twilight-700/70">
            {user.email}
          </p>
        </div>
      </div>
      <button
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-frosted-blue-200 bg-white px-2.5 text-xs font-semibold text-deep-twilight-700 outline-none transition-colors hover:border-bright-teal-blue-200 hover:bg-frosted-blue-50 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
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
  const icons: Record<DashboardIconName, LucideIcon> = {
    dashboard: LayoutDashboard,
    folder: FolderOpen,
    materials: Package,
    quotes: FileText,
    settings: Settings,
  };
  const Icon = icons[name];

  return <Icon aria-hidden="true" className={className} />;
}
