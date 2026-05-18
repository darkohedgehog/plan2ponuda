"use client";

import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CheckoutBillingPlanInput } from "@/lib/validations/billing.schema";
import type {
  BillingCheckoutResponse,
  BillingProfileFieldKey,
  BillingPortalResponse,
} from "@/types/billing";

type CheckoutStatus = "cancelled" | "success" | null;
type PendingBillingAction = CheckoutBillingPlanInput | "portal";
type BillingActionErrorKey =
  | "billingProfileIncomplete"
  | "checkoutFailed"
  | "billingProfileRequired"
  | "portalFailed";

type BillingActionsProps = {
  canManageSubscription: boolean;
  checkoutStatus: CheckoutStatus;
  hasBillingProfile: boolean;
};

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  return response.json().catch((): null => null) as Promise<T | null>;
}

export function BillingActions({
  canManageSubscription,
  checkoutStatus,
  hasBillingProfile,
}: BillingActionsProps) {
  const tBilling = useTranslations("Billing");
  const tBillingProfile = useTranslations("BillingProfile");
  const [errorKey, setErrorKey] = useState<BillingActionErrorKey | null>(null);
  const [missingFields, setMissingFields] = useState<BillingProfileFieldKey[]>(
    [],
  );
  const [pendingAction, setPendingAction] =
    useState<PendingBillingAction | null>(null);

  function clearError() {
    setErrorKey(null);
    setMissingFields([]);
  }

  function getMissingFieldNames(): string {
    return missingFields
      .map((field) => tBillingProfile(`fields.${field}`))
      .join(", ");
  }

  async function startCheckout(plan: CheckoutBillingPlanInput) {
    clearError();

    if (!hasBillingProfile) {
      setErrorKey("billingProfileRequired");
      return;
    }

    setPendingAction(plan);

    const response = await fetch("/api/billing/checkout", {
      body: JSON.stringify({ plan }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload =
      await parseJsonResponse<BillingCheckoutResponse>(response);

    if (response.ok && payload?.ok) {
      window.location.assign(payload.url);
      return;
    }

    if (
      payload &&
      !payload.ok &&
      payload.error.code === "billing_profile_incomplete"
    ) {
      setMissingFields(payload.error.missingFields ?? []);
      setErrorKey("billingProfileIncomplete");
    } else if (
      payload &&
      !payload.ok &&
      payload.error.code === "billing_profile_required"
    ) {
      setErrorKey("billingProfileRequired");
    } else {
      setErrorKey("checkoutFailed");
    }

    setPendingAction(null);
  }

  async function openBillingPortal() {
    clearError();

    if (!canManageSubscription) {
      setErrorKey("portalFailed");
      return;
    }

    setPendingAction("portal");

    const response = await fetch("/api/billing/portal", {
      method: "POST",
    });
    const payload = await parseJsonResponse<BillingPortalResponse>(response);

    if (response.ok && payload?.ok) {
      window.location.assign(payload.url);
      return;
    }

    setErrorKey("portalFailed");
    setPendingAction(null);
  }

  const isPending = pendingAction !== null;

  return (
    <div className="mt-5 grid gap-3">
      {checkoutStatus ? (
        <div
          className={
            checkoutStatus === "success"
              ? "rounded-md border border-bright-teal-blue-200 bg-bright-teal-blue-50 px-4 py-3 text-sm font-medium text-deep-twilight-800"
              : "rounded-md border border-frosted-blue-200 bg-frosted-blue-50 px-4 py-3 text-sm font-medium text-deep-twilight-700"
          }
        >
          {checkoutStatus === "success"
            ? tBilling("messages.checkoutConfirmationPending")
            : tBilling("messages.checkoutCancelled")}
        </div>
      ) : null}

      {errorKey ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorKey === "billingProfileRequired" ? (
            tBilling("errors.completeBillingProfileBeforeCheckout")
          ) : errorKey === "billingProfileIncomplete" ? (
            missingFields.length > 0
              ? tBilling("errors.completeRequiredBillingProfileFields", {
                  fields: getMissingFieldNames(),
                })
              : tBilling("errors.completeBillingProfileBeforeCheckout")
          ) : (
            tBilling(
              errorKey === "portalFailed"
                ? "errors.portalFailed"
                : "errors.checkoutFailed",
            )
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={isPending}
          onClick={() => void startCheckout("basic")}
          type="button"
        >
          {pendingAction === "basic" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard aria-hidden="true" className="h-4 w-4" />
          )}
          {pendingAction === "basic"
            ? tBilling("actions.preparingCheckout")
            : tBilling("actions.upgradeBasic")}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => void startCheckout("pro")}
          type="button"
        >
          {pendingAction === "pro" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard aria-hidden="true" className="h-4 w-4" />
          )}
          {pendingAction === "pro"
            ? tBilling("actions.preparingCheckout")
            : tBilling("actions.upgradePro")}
        </Button>
        <Button
          disabled={isPending || !canManageSubscription}
          onClick={() => void openBillingPortal()}
          type="button"
          variant="secondary"
        >
          {pendingAction === "portal" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          )}
          {pendingAction === "portal"
            ? tBilling("actions.openingPortal")
            : tBilling("actions.manageSubscription")}
        </Button>
      </div>
    </div>
  );
}
