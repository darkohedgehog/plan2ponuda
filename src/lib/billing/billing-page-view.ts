import type { BillingPlan } from "@/types/billing";

export type BillingActionVisibility = {
  showManageSubscription: boolean;
  showUpgradeBasic: boolean;
  showUpgradePro: boolean;
};

export function getBillingActionVisibility(
  plan: BillingPlan,
  hasStripeCustomer: boolean,
): BillingActionVisibility {
  return {
    showManageSubscription: hasStripeCustomer || plan !== "free",
    showUpgradeBasic: plan === "free",
    showUpgradePro: plan === "free" || plan === "basic",
  };
}
