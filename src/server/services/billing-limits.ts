export const billingPlanValues = ["free", "basic", "pro"] as const;
export const usageCounterTypeValues = [
  "floor_plans_created",
  "quotes_created",
  "large_pdf_analyses_used",
] as const;

export type BillingPlanValue = (typeof billingPlanValues)[number];
export type BillingFeature = "floorPlans" | "quotes" | "largePdfAnalyses";
export type UsageCounterTypeValue = (typeof usageCounterTypeValues)[number];

export type BillingPlanLimits = Record<BillingFeature, number>;

export const BILLING_PLAN_LIMITS: Record<BillingPlanValue, BillingPlanLimits> = {
  basic: {
    floorPlans: 10,
    largePdfAnalyses: 0,
    quotes: 10,
  },
  free: {
    floorPlans: 1,
    largePdfAnalyses: 0,
    quotes: 1,
  },
  pro: {
    floorPlans: 20,
    // TODO: Confirm final Pro large PDF analysis limit before Stripe launch.
    largePdfAnalyses: 3,
    quotes: 20,
  },
};

const usageCounterTypeByFeature: Record<BillingFeature, UsageCounterTypeValue> = {
  floorPlans: "floor_plans_created",
  largePdfAnalyses: "large_pdf_analyses_used",
  quotes: "quotes_created",
};

export function getUsageCounterTypeForFeature(
  feature: BillingFeature,
): UsageCounterTypeValue {
  return usageCounterTypeByFeature[feature];
}

export function getFeatureForUsageCounterType(
  type: UsageCounterTypeValue,
): BillingFeature {
  switch (type) {
    case "floor_plans_created":
      return "floorPlans";
    case "quotes_created":
      return "quotes";
    case "large_pdf_analyses_used":
      return "largePdfAnalyses";
  }
}

type CanUsePlanFeatureInput = {
  feature: BillingFeature;
  plan: BillingPlanValue;
  usage: number;
};

export function canUsePlanFeature({
  feature,
  plan,
  usage,
}: CanUsePlanFeatureInput): boolean {
  return usage < BILLING_PLAN_LIMITS[plan][feature];
}
