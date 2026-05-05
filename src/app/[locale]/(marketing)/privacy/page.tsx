import { useTranslations } from "next-intl";

import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function PrivacyPage() {
  const tPrivacy = useTranslations("Marketing.pages.privacy");

  return (
    <PublicPageShell
      subtitle={tPrivacy("subtitle")}
      title={tPrivacy("title")}
    >
      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        {tPrivacy("body")}
      </p>
    </PublicPageShell>
  );
}
