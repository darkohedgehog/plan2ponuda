import {
  ArrowRight,
  Bot,
  Building2,
  CreditCard,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "@/i18n/navigation";

const reasonItems = [
  { icon: MessageCircle, key: "product" },
  { icon: CreditCard, key: "billing" },
  { icon: Bot, key: "feedback" },
] as const;

type ContactPageContentProps = {
  isAuthenticated: boolean;
};

export function ContactPageContent({
  isAuthenticated,
}: ContactPageContentProps) {
  const tContact = useTranslations("Contact");
  const primaryHref = isAuthenticated ? "/dashboard/projects" : "/sign-up";
  const primaryLabel = isAuthenticated
    ? tContact("cta.primaryAuthenticated")
    : tContact("cta.primary");
  const title = tContact("title");
  const brandName = "PloroAI";
  const [titleBeforeBrand, titleAfterBrand] = title.split(brandName);

  return (
    <main className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(0,166,255,0.16),transparent_25rem),radial-gradient(circle_at_82%_18%,rgba(0,212,255,0.14),transparent_28rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_46%,#e9f9fc_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.24] bg-[linear-gradient(rgba(0,99,153,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.12)_1px,transparent_1px)] bg-size-[38px_38px]"
      />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:px-8 lg:py-20">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-bright-teal-blue-700">
            {tContact("eyebrow")}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-deep-twilight-950 wrap-anywhere sm:text-5xl lg:text-6xl">
            {titleAfterBrand !== undefined ? (
              <>
                {titleBeforeBrand}
                <span className="text-bright-teal-blue-600">{brandName}</span>
                {titleAfterBrand}
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-deep-twilight-700 sm:text-lg">
            {tContact("description")}
          </p>

          <div className="mt-9 grid gap-5 lg:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-bright-teal-blue-200/80 bg-white/92 p-6 shadow-[0_18px_48px_rgba(0,166,255,0.11)] backdrop-blur">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
                <Mail aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-deep-twilight-950">
                {tContact("emailLabel")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
                {tContact("emailDescription")}
              </p>
              <a
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2 sm:w-fit"
                href={`mailto:${tContact("emailAddress")}`}
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                {tContact("emailAddress")}
              </a>
            </article>

            <article className="min-w-0 rounded-2xl border border-frosted-blue-200 bg-white/88 p-6 shadow-[0_18px_44px_rgba(1,2,35,0.07)] backdrop-blur">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-deep-twilight-950 text-turquoise-surf-300 ring-1 ring-deep-twilight-200">
                <Building2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-deep-twilight-950">
                {tContact("companyTitle")}
              </h2>
              <address className="mt-3 not-italic text-sm leading-6 text-deep-twilight-700">
                <span className="block font-semibold text-deep-twilight-950">
                  {tContact("companyName")}
                </span>
                <span className="block">{tContact("companyAddressLine1")}</span>
                <span className="block">{tContact("companyAddressLine2")}</span>
              </address>
            </article>
          </div>
        </div>

        <aside className="relative min-w-0 lg:pt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-deep-twilight-200 bg-deep-twilight-950 p-4 shadow-[0_28px_70px_rgba(1,2,35,0.22)] sm:p-5">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,212,255,0.25),transparent_16rem),linear-gradient(135deg,rgba(1,2,35,0.4),rgba(0,23,36,0.72))]"
            />
            <Image
              alt={tContact("botAlt")}
              className="relative z-10 aspect-[3/2] w-full rounded-[1.5rem] object-cover object-center"
              height={1024}
              priority
              src="/ploroai-bot.webp"
              width={1536}
            />
            <div className="relative z-10 mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-deep-twilight-100/82 backdrop-blur">
              {tContact("emailDescription")}
            </div>
          </div>
        </aside>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-5 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-frosted-blue-200 bg-white/86 p-6 shadow-sm backdrop-blur">
            <h2 className="text-2xl font-semibold tracking-tight text-deep-twilight-950">
              {tContact("reasons.title")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-deep-twilight-700">
              {tContact("emailDescription")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {reasonItems.map(({ icon: Icon, key }) => (
              <article
                className="min-w-0 rounded-2xl border border-frosted-blue-200 bg-white/90 p-5 shadow-[0_14px_34px_rgba(1,2,35,0.06)] backdrop-blur"
                key={key}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bright-teal-blue-50 text-bright-teal-blue-700">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-deep-twilight-950">
                  {tContact(`reasons.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
                  {tContact(`reasons.${key}.description`)}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5 overflow-hidden rounded-2xl border border-bright-teal-blue-200/80 bg-deep-twilight-950 p-6 text-white shadow-[0_24px_56px_rgba(1,2,35,0.18)] sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight wrap-anywhere">
              {tContact("cta.title")}
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-bright-teal-blue-500 px-5 text-sm font-semibold text-deep-twilight-950 outline-none transition-colors hover:bg-turquoise-surf-400 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-twilight-950"
              href={primaryHref}
            >
              {primaryLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 bg-white/[0.06] px-5 text-sm font-semibold text-white outline-none transition-colors hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-bright-teal-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-twilight-950"
              href="/pricing"
            >
              {tContact("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
