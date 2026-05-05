import { useTranslations } from "next-intl";

import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function ContactPage() {
  const tContact = useTranslations("Marketing.pages.contact");

  return (
    <PublicPageShell
      subtitle={tContact("subtitle")}
      title={tContact("title")}
    >
      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        {tContact("body")}
      </p>
    </PublicPageShell>
  );
}
