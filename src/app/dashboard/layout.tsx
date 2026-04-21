import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/session";

type DashboardLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
