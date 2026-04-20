type QuoteSummaryProps = {
  projectName: string;
};

export function QuoteSummary({ projectName }: QuoteSummaryProps) {
  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <h2 className="text-lg font-semibold">Quote for {projectName}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Material list and PDF export summary placeholder.
      </p>
    </section>
  );
}
