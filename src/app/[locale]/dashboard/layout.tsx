import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
