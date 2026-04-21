export default function MaterialsPage() {
  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Materials catalog</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Materials
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Material catalog management will appear here when material calculation
          workflows are expanded.
        </p>
      </section>
    </main>
  );
}
