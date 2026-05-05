import { useTranslations } from "next-intl";

import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function PricingPage() {
  const tPricing = useTranslations("Marketing.pages.pricing");

  return (
    <PublicPageShell
      subtitle={tPricing("subtitle")}
      title={tPricing("title")}
    >
      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        {tPricing("body")}
      </p>
    </PublicPageShell>
  );
}
