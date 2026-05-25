import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";

type LegalPageContentProps = {
  namespace: "Contact" | "Cookies" | "Privacy" | "Terms";
  sectionKeys: readonly string[];
};

export function LegalPageContent({
  namespace,
  sectionKeys,
}: LegalPageContentProps) {
  const tLegal = useTranslations("Legal");
  const tPage = useTranslations(namespace);
  const isContactPage = namespace === "Contact";

  return (
    <main className="overflow-hidden bg-frosted-blue-50">
      <div className="mx-auto w-full max-w-5xl min-w-0 overflow-hidden px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <section className="w-full max-w-[20rem] min-w-0 sm:max-w-3xl">
          <h1 className="wrap-break-word text-4xl font-semibold tracking-tight text-deep-twilight-950 sm:text-5xl">
            {tPage("title")}
          </h1>
          <p className="mt-5 wrap-break-word text-base leading-7 text-deep-twilight-700 sm:text-lg">
            {tPage("description")}
          </p>
        </section>

        <section className="mt-8 w-full max-w-[20rem] min-w-0 overflow-hidden rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 sm:max-w-none">
          <p className="font-semibold">{tLegal("draftNoticeTitle")}</p>
          <p className="mt-1 wrap-break-word">{tLegal("draftNoticeDescription")}</p>
        </section>

        <section className="mt-8 grid w-full max-w-[20rem] min-w-0 gap-4 sm:max-w-none">
          {sectionKeys.map((sectionKey) => (
            <article
              className="min-w-0 overflow-hidden rounded-md border border-frosted-blue-200 bg-white p-5 shadow-sm"
              key={sectionKey}
            >
              <h2 className="wrap-break-word text-xl font-semibold text-deep-twilight-950">
                {tPage(`sections.${sectionKey}.title`)}
              </h2>
              <p className="mt-3 wrap-break-word text-sm leading-6 text-deep-twilight-700">
                {tPage(`sections.${sectionKey}.body`)}
              </p>
            </article>
          ))}
        </section>

        {isContactPage ? (
          <section className="mt-8 w-full max-w-[20rem] min-w-0 overflow-hidden rounded-md border border-deep-twilight-200 bg-deep-twilight-950 p-5 text-white shadow-sm sm:max-w-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="wrap-break-word text-xl font-semibold">
                  {tPage("emailTitle")}
                </h2>
                <p className="mt-2 wrap-break-word text-sm leading-6 text-deep-twilight-100">
                  {tPage("emailDescription")}
                </p>
              </div>
              <a
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-deep-twilight-950 outline-none transition-colors hover:bg-frosted-blue-100 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-twilight-950 sm:w-auto"
                href={`mailto:${tPage("emailAddress")}`}
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                {tPage("emailAddress")}
              </a>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
