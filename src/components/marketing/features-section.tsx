import { useTranslations } from "next-intl";

const featureKeys = [
  "roomDetection",
  "electricalSuggestions",
  "materialQuote",
] as const;

export function FeaturesSection() {
  const tFeatures = useTranslations("Marketing.features");

  return (
    <section className="bg-white py-20" id="features">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-blue-700">
            {tFeatures("eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {tFeatures("title")}
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            {tFeatures("description")}
          </p>
        </div>

        <div className="grid gap-4">
          {featureKeys.map((featureKey) => (
            <article
              className="rounded-md border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300"
              key={featureKey}
            >
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    {tFeatures(`items.${featureKey}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {tFeatures(`items.${featureKey}.description`)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
