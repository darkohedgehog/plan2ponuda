import { useTranslations } from "next-intl";

import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function TermsPage() {
  const tTerms = useTranslations("Marketing.pages.terms");

  return (
    <PublicPageShell
      subtitle={tTerms("subtitle")}
      title={tTerms("title")}
    >
      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        {tTerms("body")}
      </p>
    </PublicPageShell>
  );
}
