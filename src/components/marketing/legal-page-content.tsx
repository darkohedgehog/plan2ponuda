import { Building2, Mail, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type LegalPageContentProps = {
  namespace: "Complaints" | "Cookies" | "Privacy" | "Terms";
  sectionKeys: readonly string[];
};

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function LegalPageContent({
  namespace,
  sectionKeys,
}: LegalPageContentProps) {
  const tLegal = useTranslations("Legal");
  const tPage = useTranslations(namespace);

  return (
    <main className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(0,166,255,0.14),transparent_25rem),radial-gradient(circle_at_82%_20%,rgba(0,212,255,0.11),transparent_27rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_48%,#e9f9fc_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.22] bg-[linear-gradient(rgba(0,99,153,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.12)_1px,transparent_1px)] bg-size-[38px_38px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.72fr_0.28fr]">
          <section className="min-w-0">
            <p className="text-sm font-semibold text-bright-teal-blue-700">
              {tLegal("eyebrow")}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-deep-twilight-950 wrap-anywhere sm:text-5xl">
              {tPage("title")}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-deep-twilight-700 break-words sm:text-lg">
              {tPage("description")}
            </p>
          </section>

          <aside className="min-w-0 overflow-hidden rounded-2xl border border-frosted-blue-200 bg-white/88 p-5 shadow-[0_18px_44px_rgba(1,2,35,0.07)] backdrop-blur">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-deep-twilight-950 text-turquoise-surf-300">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-deep-twilight-950">
              {tLegal("operator.title")}
            </h2>
            <dl className="mt-4 grid gap-3 text-sm leading-6 text-deep-twilight-700">
              <div className="min-w-0">
                <dt className="font-semibold text-deep-twilight-950">
                  {tLegal("operator.ownerLabel")}
                </dt>
                <dd className="break-words">{tLegal("operator.owner")}</dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-deep-twilight-950">
                  {tLegal("operator.vatLabel")}
                </dt>
                <dd className="break-words">{tLegal("operator.vatId")}</dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-deep-twilight-950">
                  {tLegal("operator.addressLabel")}
                </dt>
                <dd className="break-words">{tLegal("operator.address")}</dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-deep-twilight-950">
                  {tLegal("operator.emailLabel")}
                </dt>
                <dd className="break-words">
                  <a
                    className="font-semibold text-bright-teal-blue-700 outline-none hover:text-bright-teal-blue-800 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2"
                    href={`mailto:${tLegal("operator.email")}`}
                  >
                    {tLegal("operator.email")}
                  </a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/92 p-5 text-sm leading-6 text-amber-950 shadow-sm">
          <div className="flex gap-3">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            />
            <div className="min-w-0">
              <p className="font-semibold">{tLegal("draftNoticeTitle")}</p>
              <p className="mt-1 break-words">
                {tLegal("draftNoticeDescription")}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {sectionKeys.map((sectionKey) => {
            const items = getStringArray(
              tPage.raw(`sections.${sectionKey}.items`),
            );

            return (
              <article
                className="min-w-0 overflow-hidden rounded-2xl border border-frosted-blue-200 bg-white/90 p-5 shadow-[0_14px_34px_rgba(1,2,35,0.05)] backdrop-blur sm:p-6"
                key={sectionKey}
              >
                <h2 className="text-xl font-semibold text-deep-twilight-950 wrap-anywhere">
                  {tPage(`sections.${sectionKey}.title`)}
                </h2>
                <p className="mt-3 text-sm leading-6 text-deep-twilight-700 break-words">
                  {tPage(`sections.${sectionKey}.body`)}
                </p>
                {items.length > 0 ? (
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-deep-twilight-700 sm:grid-cols-2">
                    {items.map((item) => (
                      <li className="flex gap-2" key={item}>
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bright-teal-blue-500"
                        />
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-deep-twilight-200 bg-deep-twilight-950 p-5 text-white shadow-[0_24px_56px_rgba(1,2,35,0.16)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">{tLegal("contactTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-deep-twilight-100/80">
                {tLegal("contactDescription")}
              </p>
            </div>
            <a
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-bright-teal-blue-500 px-4 text-sm font-semibold text-deep-twilight-950 outline-none transition-colors hover:bg-turquoise-surf-400 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-twilight-950 sm:w-auto"
              href={`mailto:${tLegal("operator.email")}`}
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              {tLegal("operator.email")}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
