import type { BillingPlan } from "@/types/billing";

export type ProjectDocumentationAnalysisState = {
  isPro: boolean;
  state: "available" | "locked";
};

export function getProjectDocumentationAnalysisState(
  plan: BillingPlan,
): ProjectDocumentationAnalysisState {
  const isPro = plan === "pro";

  return {
    isPro,
    state: isPro ? "available" : "locked",
  };
}
