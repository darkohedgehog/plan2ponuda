import type { ReactNode } from "react";

import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { getOptionalCurrentUser } from "@/lib/auth/session";

type MarketingLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: MarketingLayoutProps) {
  const user = await getOptionalCurrentUser();

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PublicNavbar isAuthenticated={Boolean(user)} />
      {children}
      <PublicFooter />
    </div>
  );
}
