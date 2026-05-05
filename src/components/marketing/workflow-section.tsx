import { useTranslations } from "next-intl";

const workflowStepKeys = [
  "uploadFloorPlan",
  "reviewRooms",
  "generateMaterials",
  "exportQuote",
] as const;

export function WorkflowSection() {
  const tWorkflow = useTranslations("Marketing.workflow");

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20" id="how-it-works">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-700">
            {tWorkflow("eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {tWorkflow("title")}
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {workflowStepKeys.map((stepKey, index) => (
            <article
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              key={stepKey}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-sm font-semibold text-blue-700">
                {index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                {tWorkflow(`steps.${stepKey}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {tWorkflow(`steps.${stepKey}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
