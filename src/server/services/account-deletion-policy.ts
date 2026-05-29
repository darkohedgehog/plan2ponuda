import type {
  BillingPlan,
  SubscriptionStatus,
} from "../../../generated/prisma/client";

export type AccountDeletionSubscription = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  plan: BillingPlan;
  status: SubscriptionStatus;
};

type AccountDeletionConfirmationInput = {
  authenticatedEmail: string;
  confirmationEmail: string;
  confirmPermanentDeletion: boolean;
};

export function getAccountDeletionConfirmationError({
  authenticatedEmail,
  confirmationEmail,
  confirmPermanentDeletion,
}: AccountDeletionConfirmationInput):
  | "confirmation_email_mismatch"
  | "confirmation_required"
  | null {
  if (!confirmPermanentDeletion) {
    return "confirmation_required";
  }

  if (confirmationEmail !== authenticatedEmail) {
    return "confirmation_email_mismatch";
  }

  return null;
}

export function isAccountDeletionSubscriptionBlocked(
  subscription: AccountDeletionSubscription | null,
  now = new Date(),
): boolean {
  if (!subscription || subscription.plan === "free") {
    return false;
  }

  if (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due"
  ) {
    return true;
  }

  return (
    subscription.cancelAtPeriodEnd &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd.getTime() > now.getTime()
  );
}
