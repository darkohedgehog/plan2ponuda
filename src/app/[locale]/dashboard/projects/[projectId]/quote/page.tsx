import { ArrowRight, ClipboardCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { QuoteSummary } from "@/components/quote/quote-summary";
import { Link, redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { projectIdSchema } from "@/lib/validations/project.schema";
import { getProjectById } from "@/server/services/project-service";
import { getQuoteWorkspace } from "@/server/services/quote-service";

type ProjectQuotePageProps = {
  params: Promise<{
    locale: string;
    projectId: string;
  }>;
};

export default async function ProjectQuotePage({
  params,
}: ProjectQuotePageProps) {
  const { locale: rawLocale, projectId } = await params;
  const locale = resolveLocale(rawLocale);
  const parsedParams = projectIdSchema.safeParse({ projectId });

  if (!parsedParams.success) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const project = await getProjectById(parsedParams.data.projectId, user.id);

  if (!project) {
    notFound();
  }

  const quoteResult = await getQuoteWorkspace(project.id, user.id);

  if (!quoteResult.ok) {
    if (quoteResult.reason === "needs_room_review") {
      return (
        <QuoteNeedsRoomReview
          projectId={project.id}
          projectName={project.name}
        />
      );
    }

    notFound();
  }

  return (
    <main className="flex flex-col gap-4">
      <QuoteSummary
        areaM2={project.areaM2}
        exportHref={`/api/pdf/${project.id}?locale=${locale}`}
        materials={quoteResult.materials}
        projectName={project.name}
        quote={quoteResult.quote}
      />
    </main>
  );
}

type QuoteNeedsRoomReviewProps = {
  projectId: string;
  projectName: string;
};

async function QuoteNeedsRoomReview({
  projectId,
  projectName,
}: QuoteNeedsRoomReviewProps) {
  const tActions = await getTranslations("Actions");
  const tWorkspace = await getTranslations("QuoteWorkspace");

  return (
    <main className="flex flex-col gap-4">
      <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-bright-teal-blue-200 bg-bright-teal-blue-50 text-bright-teal-blue-700">
              <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-bright-teal-blue-700">
              {tWorkspace("hero.eyebrow")}
            </p>
            <h1 className="mt-2 wrap-break-word text-2xl font-semibold tracking-tight text-deep-twilight-950 sm:text-3xl">
              {projectName}
            </h1>
            <h2 className="mt-5 text-lg font-semibold text-deep-twilight-950">
              {tWorkspace("materials.needsReviewTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-deep-twilight-700">
              {tWorkspace("materials.needsReviewDescription")}
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href={`/dashboard/projects/${projectId}/review`}
          >
            {tActions("openRoomReview")}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
