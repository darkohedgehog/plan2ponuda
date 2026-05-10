"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  AnalysisErrorCode,
  AnalyzeProjectResponse,
} from "@/types/analysis";

type AnalyzeFloorPlanButtonProps = {
  hasExistingRooms: boolean;
  hasFloorPlan: boolean;
  projectId: string;
};

type AnalysisFeedbackKey =
  | "analysis.errors.aiFailed"
  | "analysis.errors.invalidInput"
  | "analysis.errors.missingFloorPlan"
  | "analysis.errors.projectNotFound"
  | "analysis.errors.rateLimited"
  | "analysis.errors.roomsAlreadyExist"
  | "analysis.errors.serverError"
  | "analysis.errors.unsupportedFileType";

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
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tReview = useTranslations("Review");
  const [errorKey, setErrorKey] = useState<AnalysisFeedbackKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomCount, setRoomCount] = useState<number | null>(null);
  const canAnalyze = hasFloorPlan && !hasExistingRooms;

  async function analyzeFloorPlan() {
    setErrorKey(null);
    setRoomCount(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/analysis/${projectId}`, {
      method: "POST",
    }).catch((): Response | null => null);

    if (!response) {
      setIsSubmitting(false);
      setErrorKey("analysis.errors.serverError");
      return;
    }

    const payload = (await response.json().catch(
      (): AnalyzeProjectResponse | null => null,
    )) as AnalyzeProjectResponse | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      setErrorKey(
        payload && "error" in payload
          ? analysisErrorKeysByCode[payload.error.code]
          : "analysis.errors.serverError",
      );
      return;
    }

    setRoomCount(payload.analysis.roomCount);
    router.refresh();
  }

  return (
    <div className="mt-4 border-t border-frosted-blue-200 pt-4">
      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={!canAnalyze || isSubmitting}
        onClick={analyzeFloorPlan}
        type="button"
      >
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        {isSubmitting
          ? tActions("analyzingFloorPlan")
          : tActions("analyzeFloorPlan")}
      </button>

      {hasExistingRooms ? (
        <p className="mt-3 text-sm text-deep-twilight-700">
          {tReview("analysis.messages.existingRooms")}
        </p>
      ) : null}
      {errorKey ? (
        <p className="mt-3 text-sm text-red-600">{tReview(errorKey)}</p>
      ) : null}
      {roomCount !== null ? (
        <p className="mt-3 text-sm text-emerald-700">
          {tReview("analysis.messages.success", { count: roomCount })}
        </p>
      ) : null}
    </div>
  );
}
