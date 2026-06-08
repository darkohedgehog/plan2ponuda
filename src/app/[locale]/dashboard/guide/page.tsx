import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  Gauge,
  HelpCircle,
  LucideIcon,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/helpers";

const quickStartStepKeys = [
  "createProject",
  "uploadFloorPlan",
  "runAnalysis",
  "reviewRooms",
  "generateQuote",
  "exportQuote",
] as const;

const planKeys = ["free", "basic", "pro"] as const;

const planFeatureKeys = {
  basic: ["floorPlans", "quotes", "analysis", "exports", "subscription"],
  free: ["floorPlans", "quotes", "noProjectDocs", "testing"],
  pro: [
    "floorPlans",
    "quotes",
    "projectDocs",
    "projectPdfExtraction",
    "candidateReview",
    "importMaterials",
  ],
} as const;

const proDocumentItemKeys = [
  "upload",
  "extract",
  "review",
  "import",
  "labor",
  "manualCheck",
] as const;

const billingItemKeys = ["limits", "billingPage", "stripe", "invoices"] as const;

const supportLinks = [
  {
    href: "/contact",
    key: "contact",
  },
  {
    href: "/dashboard/billing",
    key: "billing",
  },
  {
    href: "/dashboard/projects",
    key: "projects",
  },
] as const;

const guideMediaCards = [
  {
    icon: FolderPlus,
    key: "createProject",
  },
  {
    icon: UploadCloud,
    key: "uploadFloorPlan",
  },
  {
    icon: SearchCheck,
    key: "reviewRooms",
  },
  {
    icon: FileSpreadsheet,
    key: "quoteExport",
  },
  {
    icon: ClipboardCheck,
    key: "proDocumentAnalysis",
  },
] as const;

const quickStartIcons: Record<(typeof quickStartStepKeys)[number], LucideIcon> = {
  createProject: FolderPlus,
  exportQuote: FileSpreadsheet,
  generateQuote: ReceiptText,
  reviewRooms: ClipboardCheck,
  runAnalysis: Sparkles,
  uploadFloorPlan: UploadCloud,
};

export default function GuidePage() {
  const t = useTranslations("Guide");

  return (
    <main className="flex min-w-0 flex-col gap-6">
      <section className="overflow-hidden rounded-lg border border-frosted-blue-200 bg-white shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:p-7">
          <div className="min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
              <BookOpen aria-hidden="true" className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-deep-twilight-950">
              {t("page.title")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-deep-twilight-700">
              {t("page.intro")}
            </p>
          </div>
          <div className="rounded-lg border border-frosted-blue-200 bg-frosted-blue-50 p-4">
            <p className="text-sm font-semibold text-deep-twilight-950">
              {t("page.summaryTitle")}
            </p>
            <div className="mt-4 grid gap-3">
              {["projects", "analysis", "exports"].map((key) => (
                <div className="flex items-start gap-3" key={key}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-bright-teal-blue-700"
                  />
                  <p className="text-sm leading-6 text-deep-twilight-700">
                    {t(`page.summary.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GuideMediaGrid />

      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          description={t("quickStart.description")}
          icon={Gauge}
          title={t("quickStart.title")}
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {quickStartStepKeys.map((stepKey, index) => (
            <QuickStartStep index={index} key={stepKey} stepKey={stepKey} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          description={t("plans.description")}
          icon={FileText}
          title={t("plans.title")}
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {planKeys.map((planKey) => (
            <PlanCard key={planKey} planKey={planKey} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            description={t("proDocuments.description")}
            icon={ClipboardCheck}
            title={t("proDocuments.title")}
          />
          <div className="mt-5 grid gap-3">
            {proDocumentItemKeys.map((itemKey) => (
              <InfoRow key={itemKey} text={t(`proDocuments.items.${itemKey}`)} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 ring-1 ring-amber-200">
              <AlertTriangle aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-amber-950">
                {t("safety.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {t("safety.body")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            description={t("billing.description")}
            icon={ReceiptText}
            title={t("billing.title")}
          />
          <div className="mt-5 grid gap-3">
            {billingItemKeys.map((itemKey) => (
              <InfoRow key={itemKey} text={t(`billing.items.${itemKey}`)} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            description={t("support.description")}
            icon={HelpCircle}
            title={t("support.title")}
          />
          <a
            className="mt-5 inline-flex rounded-md text-sm font-semibold text-bright-teal-blue-700 outline-none hover:text-bright-teal-blue-800 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100"
            href="mailto:contact@ploroai.io"
          >
            contact@ploroai.io
          </a>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {supportLinks.map((link) => (
              <Link
                className="inline-flex min-h-11 items-center justify-between gap-3 rounded-md border border-frosted-blue-200 bg-white px-3 py-2 text-sm font-semibold text-deep-twilight-800 shadow-sm outline-none transition-colors hover:border-bright-teal-blue-200 hover:bg-frosted-blue-50 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
                href={link.href}
                key={link.key}
              >
                {t(`support.links.${link.key}`)}
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

type SectionHeadingProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

function SectionHeading({ description, icon: Icon, title }: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bright-teal-blue-50 text-bright-teal-blue-700 ring-1 ring-bright-teal-blue-100">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-deep-twilight-950">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-deep-twilight-700">
          {description}
        </p>
      </div>
    </div>
  );
}

type QuickStartStepProps = {
  index: number;
  stepKey: (typeof quickStartStepKeys)[number];
};

function QuickStartStep({ index, stepKey }: QuickStartStepProps) {
  const t = useTranslations("Guide");
  const Icon = quickStartIcons[stepKey];

  return (
    <article className="rounded-md border border-frosted-blue-200 bg-frosted-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-bright-teal-blue-700 ring-1 ring-frosted-blue-200">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-deep-twilight-500">
            {t("quickStart.stepLabel", { number: index + 1 })}
          </p>
          <h3 className="mt-1 text-base font-semibold text-deep-twilight-950">
            {t(`quickStart.steps.${stepKey}.title`)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
            {t(`quickStart.steps.${stepKey}.description`)}
          </p>
        </div>
      </div>
    </article>
  );
}

type PlanCardProps = {
  planKey: (typeof planKeys)[number];
};

function PlanCard({ planKey }: PlanCardProps) {
  const t = useTranslations("Guide");
  const isPro = planKey === "pro";

  return (
    <article
      className={cn(
        "rounded-md border p-4",
        isPro
          ? "border-deep-twilight-200 bg-deep-twilight-950 text-white"
          : "border-frosted-blue-200 bg-frosted-blue-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            className={cn(
              "text-lg font-semibold",
              isPro ? "text-white" : "text-deep-twilight-950",
            )}
          >
            {t(`plans.${planKey}.title`)}
          </h3>
          <p
            className={cn(
              "mt-1 text-sm leading-6",
              isPro ? "text-deep-twilight-100" : "text-deep-twilight-700",
            )}
          >
            {t(`plans.${planKey}.description`)}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2">
        {planFeatureKeys[planKey].map((featureKey) => (
          <li className="flex items-start gap-2" key={featureKey}>
            <CheckCircle2
              aria-hidden="true"
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                isPro ? "text-turquoise-surf-300" : "text-bright-teal-blue-700",
              )}
            />
            <span
              className={cn(
                "text-sm leading-6",
                isPro ? "text-deep-twilight-100" : "text-deep-twilight-700",
              )}
            >
              {t(`plans.${planKey}.features.${featureKey}`)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

type InfoRowProps = {
  text: string;
};

function InfoRow({ text }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-3 py-2.5">
      <ShieldCheck
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-bright-teal-blue-700"
      />
      <p className="text-sm leading-6 text-deep-twilight-700">{text}</p>
    </div>
  );
}

function GuideMediaGrid() {
  const t = useTranslations("Guide.media");

  return (
    <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-deep-twilight-950">
          {t("title")}
        </h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {guideMediaCards.map((card) => (
          <GuideMediaCard
            icon={card.icon}
            key={card.key}
            title={t(`items.${card.key}.title`)}
          />
        ))}
      </div>
    </section>
  );
}

type GuideMediaCardProps = {
  icon: LucideIcon;
  title: string;
};

function GuideMediaCard({ icon: Icon, title }: GuideMediaCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-frosted-blue-200 bg-frosted-blue-50">
      <div className="relative aspect-4/3 bg-white">
        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.16),transparent_12rem),linear-gradient(180deg,#ffffff_0%,#eef7fb_100%)] text-bright-teal-blue-700">
          <Icon aria-hidden="true" className="h-10 w-10" />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-deep-twilight-950">{title}</h3>
      </div>
    </article>
  );
}
