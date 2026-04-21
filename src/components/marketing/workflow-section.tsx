const workflowSteps = [
  {
    title: "Upload floor plan",
    description: "Start with a PDF, blueprint, or image from your client.",
  },
  {
    title: "Review rooms",
    description: "Confirm detected spaces and adjust names before estimating.",
  },
  {
    title: "Generate materials",
    description: "Create socket, switch, lighting, cable, and equipment suggestions.",
  },
  {
    title: "Export quote",
    description: "Turn the reviewed plan into a structured client-ready offer.",
  },
];

export function WorkflowSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20" id="how-it-works">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-700">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
            From plan upload to quote export in one focused workflow.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <article
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              key={step.title}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-sm font-semibold text-blue-700">
                {index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
