import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserProjectDashboardOverview } from "@/server/services/project-service";

type DashboardPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const overview = await getUserProjectDashboardOverview(user.id);

  return <DashboardOverview overview={overview} userName={user.name} />;
}
