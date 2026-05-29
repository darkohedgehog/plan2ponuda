import { HelpCircle, Mail, MessageSquareWarning, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const faqItemKeys = [
  "whatIs",
  "aiReview",
  "free",
  "basic",
  "pro",
  "cancel",
  "payments",
  "invoices",
  "refund",
  "storage",
  "projectPdf",
  "contact",
] as const;

const resourceLinks = [
  { href: "/pricing", icon: ReceiptText, key: "pricing" },
  { href: "/terms", icon: HelpCircle, key: "terms" },
  { href: "/contact", icon: Mail, key: "contact" },
  { href: "/complaints", icon: MessageSquareWarning, key: "complaints" },
] as const;

export function FaqSection() {
  const tFaq = useTranslations("Marketing.faq");
  const title = tFaq("title");
  const titleAccent = tFaq("titleAccent");
  const [titleBeforeAccent, titleAfterAccent] = title.split(titleAccent);

  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24"
      id="faq"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,166,255,0.13),transparent_24rem),radial-gradient(circle_at_84%_32%,rgba(0,212,255,0.10),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_54%,#ffffff_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.22] bg-[linear-gradient(rgba(0,99,153,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.12)_1px,transparent_1px)] bg-size-[38px_38px]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-20 top-24 h-60 w-60 rounded-full border border-bright-teal-blue-200/70"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div className="min-w-0 max-w-2xl">
            <p className="text-sm font-semibold text-bright-teal-blue-700">
              {tFaq("eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-deep-twilight-950 wrap-anywhere sm:text-5xl">
              {titleAfterAccent !== undefined ? (
                <>
                  {titleBeforeAccent}
                  <span className="text-bright-teal-blue-600">
                    {titleAccent}
                  </span>
                  {titleAfterAccent}
                </>
              ) : (
                title
              )}
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-7 text-deep-twilight-700 lg:ml-auto">
            {tFaq("description")}
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {faqItemKeys.map((itemKey) => (
            <article
              className="min-w-0 rounded-2xl border border-frosted-blue-200 bg-white/92 p-5 shadow-[0_18px_45px_rgba(1,2,35,0.06)] backdrop-blur sm:p-6"
              key={itemKey}
            >
              <h3 className="text-base font-semibold leading-7 text-deep-twilight-950">
                {tFaq(`items.${itemKey}.question`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-deep-twilight-700">
                {tFaq(`items.${itemKey}.answer`)}
              </p>
            </article>
          ))}
        </div>

        <nav
          aria-label={tFaq("links.ariaLabel")}
          className="mt-8 grid gap-3 rounded-2xl border border-bright-teal-blue-100 bg-bright-teal-blue-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {resourceLinks.map(({ href, icon: Icon, key }) => (
            <Link
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-900 shadow-sm outline-none transition-colors hover:bg-frosted-blue-50 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2"
              href={href}
              key={href}
            >
              <Icon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-bright-teal-blue-700"
              />
              <span className="min-w-0 truncate">{tFaq(`links.${key}`)}</span>
            </Link>
          ))}
        </nav>

        {/* TODO(legal): refund/withdrawal wording must be reviewed by lawyer/accountant before production launch. */}
      </div>
    </section>
  );
}
