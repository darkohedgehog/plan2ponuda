import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserProjectDashboardOverview } from "@/server/services/project-service";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const overview = await getUserProjectDashboardOverview(user.id);

  return <DashboardOverview overview={overview} userName={user.name} />;
}
