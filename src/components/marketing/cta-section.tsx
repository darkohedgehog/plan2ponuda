import Link from "next/link";

type CtaSectionProps = {
  isAuthenticated: boolean;
};

export function CtaSection({ isAuthenticated }: CtaSectionProps) {
  const startProjectHref = isAuthenticated
    ? "/dashboard/projects/new"
    : "/sign-up";

  return (
    <section className="bg-slate-950 px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-300">Ready when the next plan arrives</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Start your first electrical quote with a cleaner workflow.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Create a project, upload the plan, and move from review to quote without
            losing time in manual spreadsheets.
          </p>
        </div>
        <Link
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-slate-950 shadow-sm outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          href={startProjectHref}
        >
          Start Project
        </Link>
      </div>
    </section>
  );
}
