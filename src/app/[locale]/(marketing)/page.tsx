import { MarketingHomepage } from "@/components/marketing/marketing-homepage";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getOptionalCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type MarketingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getOptionalCurrentUser();

  if (user) {
    return redirect({ href: "/dashboard", locale });
  }

  return <MarketingHomepage isAuthenticated={false} />;
}
