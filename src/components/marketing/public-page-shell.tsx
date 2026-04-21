import type { ReactNode } from "react";

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
  return (
    <main className="bg-slate-50">
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-700">Plan2Ponuda</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{subtitle}</p>
        </section>
        {children ? (
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            {children}
          </section>
        ) : null}
      </div>
    </main>
  );
}
