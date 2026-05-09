import type { ReactNode } from "react";

import { useTranslations } from "next-intl";

type PublicPageShellProps = {
  children?: ReactNode;
  subtitle: string;
  title: string;
};

export function PublicPageShell({
  children,
  subtitle,
  title,
}: PublicPageShellProps) {
  const tCommon = useTranslations("Common");

  return (
    <main className="bg-frosted-blue-50">
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold text-bright-teal-blue-700">
            {tCommon("appName")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-deep-twilight-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-deep-twilight-700">{subtitle}</p>
        </section>
        {children ? (
          <section className="rounded-md border border-frosted-blue-200 bg-white p-6 shadow-sm">
            {children}
          </section>
        ) : null}
      </div>
    </main>
  );
}
