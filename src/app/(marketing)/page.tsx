import { redirect } from "next/navigation";

import { MarketingHomepage } from "@/components/marketing/marketing-homepage";
import { getOptionalCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const user = await getOptionalCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <MarketingHomepage isAuthenticated={false} />;
}
