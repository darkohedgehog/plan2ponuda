export default function ProjectsLoading() {
  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="mt-4 h-9 w-48 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-full max-w-xl rounded bg-slate-200" />
          </div>
          <div className="h-11 w-32 rounded-md bg-slate-200" />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="h-5 w-28 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-48 rounded bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(8rem,0.95fr)_minmax(6rem,0.7fr)_minmax(7rem,0.65fr)_auto] lg:items-center lg:gap-5"
              key={index}
            >
              <div>
                <div className="h-5 w-48 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-32 rounded bg-slate-200" />
              </div>
              <div className="h-9 rounded bg-slate-200" />
              <div className="h-9 rounded bg-slate-200" />
              <div className="h-9 rounded bg-slate-200" />
              <div className="h-10 w-28 rounded-md bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
