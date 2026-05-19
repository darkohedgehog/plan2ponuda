import type { BillingPlan } from "@/types/billing";

export type ProjectDocumentationAnalysisState = {
  isPro: boolean;
  state: "coming_soon" | "locked";
};

export function getProjectDocumentationAnalysisState(
  plan: BillingPlan,
): ProjectDocumentationAnalysisState {
  const isPro = plan === "pro";

  return {
    isPro,
    state: isPro ? "coming_soon" : "locked",
  };
}
