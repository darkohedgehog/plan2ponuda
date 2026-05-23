import { useTranslations } from "next-intl";
import {
  Boxes,
  Calculator,
  Clock,
  FileDown,
  FileSearch,
  LayoutDashboard,
} from "lucide-react";

const features = [
  { icon: FileSearch, key: "floorPlan" },
  { icon: Boxes, key: "materialTakeoff" },
  { icon: Calculator, key: "estimates" },
  { icon: FileDown, key: "export" },
  { icon: LayoutDashboard, key: "dashboard" },
  { icon: Clock, key: "timeSaving" },
] as const;

export function FeaturesSection() {
  const tFeatures = useTranslations("Marketing.features");
  const title = tFeatures("title");
  const titleAccent = tFeatures("titleAccent");
  const [titleBeforeAccent, titleAfterAccent] = title.split(titleAccent);

  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24" id="features">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(0,166,255,0.12),transparent_24rem),radial-gradient(circle_at_82%_36%,rgba(0,212,255,0.10),transparent_24rem),linear-gradient(180deg,#ffffff_0%,#f8fcff_54%,#ffffff_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(0,99,153,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,99,153,0.12)_1px,transparent_1px)] [background-size:34px_34px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-bright-teal-blue-200/70"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-bright-teal-blue-700">
            {tFeatures("eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-deep-twilight-950 sm:text-5xl">
            {titleAfterAccent !== undefined ? (
              <>
                {titleBeforeAccent}
                <span className="text-bright-teal-blue-600">{titleAccent}</span>
                {titleAfterAccent}
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-deep-twilight-700">
            {tFeatures("description")}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, key: featureKey }) => (
            <article
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-frosted-blue-200 bg-white/90 p-6 shadow-[0_18px_45px_rgba(1,2,35,0.06)] transition-colors hover:border-bright-teal-blue-200"
              key={featureKey}
            >
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-bright-teal-blue-100/55 blur-2xl transition-opacity group-hover:opacity-80"
              />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-700 shadow-[0_12px_28px_rgba(0,166,255,0.16)]">
                <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h3 className="relative mt-5 text-lg font-semibold text-deep-twilight-950">
                {tFeatures(`items.${featureKey}.title`)}
              </h3>
              <p className="relative mt-3 text-sm leading-6 text-deep-twilight-700">
                {tFeatures(`items.${featureKey}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
