"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  getAnalyzeFloorPlanUiState,
  type AnalysisFeedback,
  type AnalysisFeedbackKey,
} from "@/components/analysis/analyze-floor-plan-state";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type {
  AnalysisErrorCode,
  AnalyzeProjectResponse,
} from "@/types/analysis";

type AnalyzeFloorPlanButtonProps = {
  hasExistingRooms: boolean;
  hasFloorPlan: boolean;
  projectId: string;
};

const analysisErrorKeysByCode: Record<AnalysisErrorCode, AnalysisFeedbackKey> =
  {
    ai_failed: "analysis.errors.aiFailed",
    invalid_input: "analysis.errors.invalidInput",
    missing_floor_plan: "analysis.errors.missingFloorPlan",
    not_found: "analysis.errors.projectNotFound",
    rate_limited: "analysis.errors.rateLimited",
    rooms_already_exist: "analysis.errors.roomsAlreadyExist",
    server_error: "analysis.errors.serverError",
    unsupported_file_type: "analysis.errors.unsupportedFileType",
  };

export function AnalyzeFloorPlanButton({
  hasExistingRooms,
  hasFloorPlan,
  projectId,
}: AnalyzeFloorPlanButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tReview = useTranslations("Review");
  const [feedback, setFeedback] = useState<AnalysisFeedback>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uiState = getAnalyzeFloorPlanUiState({
    feedback,
    hasExistingRooms,
    hasFloorPlan,
    isSubmitting,
  });
  const reviewPath = `/dashboard/projects/${projectId}/review`;
  const isReviewPage = pathname === reviewPath || pathname.endsWith(reviewPath);

  function syncAnalysisRouteData() {
    if (!isReviewPage) {
      router.push(reviewPath);
    }

    router.refresh();
  }

  async function analyzeFloorPlan() {
    if (uiState.button.disabled) {
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/analysis/${projectId}`, {
      method: "POST",
    }).catch((): Response | null => null);

    if (!response) {
      setIsSubmitting(false);
      setFeedback({ kind: "error", key: "analysis.errors.serverError" });
      return;
    }

    const payload = (await response.json().catch(
      (): AnalyzeProjectResponse | null => null,
    )) as AnalyzeProjectResponse | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      if (payload && "error" in payload) {
        if (payload.error.code === "rooms_already_exist") {
          syncAnalysisRouteData();
          return;
        }

        setFeedback({
          kind: "error",
          key: analysisErrorKeysByCode[payload.error.code],
        });
        return;
      }

      setFeedback({ kind: "error", key: "analysis.errors.serverError" });
      return;
    }

    setFeedback(
      payload.analysis.roomCount > 0
        ? { kind: "success", roomCount: payload.analysis.roomCount }
        : { kind: "emptySuccess" },
    );
    syncAnalysisRouteData();
  }

  return (
    <div className="mt-4 border-t border-frosted-blue-200 pt-4">
      {uiState.button.visible ? (
        <button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={uiState.button.disabled}
          onClick={analyzeFloorPlan}
          type="button"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {tActions(uiState.button.labelKey)}
        </button>
      ) : null}

      {uiState.feedback?.kind === "existingRooms" ? (
        <div className="mt-3 rounded-md border border-frosted-blue-200 bg-frosted-blue-50 p-3">
          <p className="text-sm leading-6 text-deep-twilight-700">
            {tReview("analysis.messages.existingRooms")}
          </p>
          <Link
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 shadow-sm outline-none transition-colors hover:bg-frosted-blue-100 hover:text-deep-twilight-950 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 sm:w-auto"
            href={`/dashboard/projects/${projectId}/review`}
          >
            {tActions("openRoomReview")}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
      {uiState.feedback?.kind === "error" ? (
        <p className="mt-3 text-sm text-red-600">
          {tReview(uiState.feedback.key)}
        </p>
      ) : null}
      {uiState.feedback?.kind === "success" ? (
        <p className="mt-3 text-sm text-emerald-700">
          {tReview("analysis.messages.success", {
            count: uiState.feedback.roomCount,
          })}
        </p>
      ) : null}
      {uiState.feedback?.kind === "emptySuccess" ? (
        <p className="mt-3 text-sm text-amber-700">
          {tReview("analysis.messages.noRoomsDetected")}
        </p>
      ) : null}
    </div>
  );
}
