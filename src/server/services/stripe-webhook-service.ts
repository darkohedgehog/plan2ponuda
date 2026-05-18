import "server-only";

import {
  Prisma,
  type BillingEvent,
  type BillingProfile as DbBillingProfile,
  type InvoiceTask,
  type Subscription as DbSubscription,
} from "../../../generated/prisma/client";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/client";
import { getStripeBillingEnv } from "@/lib/utils/env";
import {
  billingProfileSchema,
  getMissingBillingProfileFields,
} from "@/lib/validations/billing.schema";
import { prisma } from "@/lib/db/prisma";
import type { BillingPlanValue } from "@/server/services/billing-limits";
import type {
  BillingProfile,
  BillingProfileFieldKey,
  CustomerType,
  SubscriptionStatus,
} from "@/types/billing";

type StripeBillingPriceEnv = {
  stripeBasicPriceId: string;
  stripeProPriceId: string;
};

type ProcessStripeWebhookEventResult = {
  billingEventId: string;
  duplicate: boolean;
  eventType: string;
};

type SyncedSubscriptionResult = {
  plan: BillingPlanValue;
  status: SubscriptionStatus;
  stripeCustomerId: string;
  stripePriceId: string | null;
  stripeSubscriptionId: string;
  userId: string;
};

type InvoiceTaskPreparation = {
  billingSnapshot: Prisma.InputJsonValue;
  customerType: CustomerType;
  status: "needs_review" | "pending";
};

const FALLBACK_CUSTOMER_TYPE: CustomerType = "outside_eu";
const MAX_PROCESSING_ERROR_LENGTH = 2000;

export function stripeTimestampToDate(value: number | null): Date | null {
  return value === null ? null : new Date(value * 1000);
}

export function mapStripePriceToBillingPlan(
  stripePriceId: string | null,
  env: StripeBillingPriceEnv = getStripeBillingEnv(),
): BillingPlanValue | null {
  if (stripePriceId === env.stripeBasicPriceId) {
    return "basic";
  }

  if (stripePriceId === env.stripeProPriceId) {
    return "pro";
  }

  return null;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    case "trialing":
      return "trialing";
    case "unpaid":
      return "unpaid";
  }
}

function getStripeObjectId(
  value: { id: string } | string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getPrimarySubscriptionItem(
  subscription: Stripe.Subscription,
  env: StripeBillingPriceEnv,
): Stripe.SubscriptionItem | null {
  const knownPlanItem = subscription.items.data.find((item) =>
    Boolean(mapStripePriceToBillingPlan(item.price.id, env)),
  );

  return knownPlanItem ?? subscription.items.data[0] ?? null;
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  const serialized = JSON.stringify(value);

  if (!serialized) {
    return {};
  }

  return JSON.parse(serialized) as Prisma.InputJsonValue;
}

function getProcessingError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown error";

  return message.slice(0, MAX_PROCESSING_ERROR_LENGTH);
}

async function getExistingUserId(userId: string | null): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    select: {
      id: true,
    },
    where: {
      id: userId,
    },
  });

  return user?.id ?? null;
}

async function resolveUserIdFromStripeRefs({
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}): Promise<string | null> {
  const filters: Prisma.SubscriptionWhereInput[] = [];

  if (stripeSubscriptionId) {
    filters.push({
      stripeSubscriptionId,
    });
  }

  if (stripeCustomerId) {
    filters.push({
      stripeCustomerId,
    });
  }

  if (filters.length === 0) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    select: {
      userId: true,
    },
    where: {
      OR: filters,
    },
  });

  return subscription?.userId ?? null;
}

async function resolveUserIdForSubscription(
  subscription: Stripe.Subscription,
  userIdHint?: string | null,
): Promise<string | null> {
  const userIdFromHint = await getExistingUserId(userIdHint ?? null);

  if (userIdFromHint) {
    return userIdFromHint;
  }

  const userIdFromMetadata = await getExistingUserId(
    subscription.metadata.userId ?? null,
  );

  if (userIdFromMetadata) {
    return userIdFromMetadata;
  }

  return resolveUserIdFromStripeRefs({
    stripeCustomerId: getStripeObjectId(subscription.customer),
    stripeSubscriptionId: subscription.id,
  });
}

function toBillingProfileSnapshot(profile: DbBillingProfile): BillingProfile {
  return {
    billingAddressLine1: profile.billingAddressLine1,
    billingAddressLine2: profile.billingAddressLine2,
    billingCity: profile.billingCity,
    billingCountry: profile.billingCountry,
    billingEmail: profile.billingEmail,
    billingName: profile.billingName,
    billingPostalCode: profile.billingPostalCode,
    companyName: profile.companyName,
    contactPerson: profile.contactPerson,
    customerType: profile.customerType,
    eInvoiceReference: profile.eInvoiceReference,
    notes: profile.notes,
    oib: profile.oib,
    phone: profile.phone,
    procurementReference: profile.procurementReference,
    purchaseOrderNumber: profile.purchaseOrderNumber,
    taxId: profile.taxId,
    vatId: profile.vatId,
  };
}

function prepareInvoiceTaskFromBillingProfile(
  profile: DbBillingProfile | null,
): InvoiceTaskPreparation {
  const parsedProfile = profile ? billingProfileSchema.safeParse(profile) : null;
  const missingFields: BillingProfileFieldKey[] = profile
    ? getMissingBillingProfileFields(profile)
    : ["customerType"];
  const customerType = profile?.customerType ?? FALLBACK_CUSTOMER_TYPE;
  const needsReview =
    !profile ||
    !parsedProfile?.success ||
    customerType === "eu_b2g_needs_review";

  return {
    billingSnapshot: toInputJsonValue({
      billingProfile: parsedProfile?.success
        ? parsedProfile.data
        : profile
          ? toBillingProfileSnapshot(profile)
          : null,
      capturedAt: new Date().toISOString(),
      missingFields,
      snapshotVersion: 1,
    }),
    customerType,
    status: needsReview ? "needs_review" : "pending",
  };
}

async function markBillingEventProcessed(
  billingEventId: string,
): Promise<BillingEvent> {
  return prisma.billingEvent.update({
    data: {
      processedAt: new Date(),
      processingError: null,
    },
    where: {
      id: billingEventId,
    },
  });
}

async function markBillingEventFailed({
  billingEventId,
  error,
}: {
  billingEventId: string;
  error: unknown;
}): Promise<BillingEvent> {
  return prisma.billingEvent.update({
    data: {
      processingError: getProcessingError(error),
    },
    where: {
      id: billingEventId,
    },
  });
}

function getInvoiceSubscriptionRef(
  invoice: Stripe.Invoice,
): Stripe.Subscription | string | null {
  return invoice.parent?.subscription_details?.subscription ?? null;
}

async function getInvoiceSubscription(
  invoice: Stripe.Invoice,
): Promise<Stripe.Subscription | null> {
  const subscriptionRef = getInvoiceSubscriptionRef(invoice);

  if (!subscriptionRef) {
    return null;
  }

  if (typeof subscriptionRef === "string") {
    return getStripeClient().subscriptions.retrieve(subscriptionRef);
  }

  return subscriptionRef;
}

async function retrieveCheckoutSubscription(
  session: Stripe.Checkout.Session,
): Promise<Stripe.Subscription | null> {
  if (!session.subscription) {
    return null;
  }

  if (typeof session.subscription === "string") {
    return getStripeClient().subscriptions.retrieve(session.subscription);
  }

  return session.subscription;
}

export async function syncSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription,
  userIdHint?: string | null,
): Promise<SyncedSubscriptionResult> {
  const env = getStripeBillingEnv();
  const stripeCustomerId = getStripeObjectId(subscription.customer);
  const subscriptionItem = getPrimarySubscriptionItem(subscription, env);
  const stripePriceId = subscriptionItem?.price.id ?? null;
  const plan = mapStripePriceToBillingPlan(stripePriceId, env) ?? "free";
  const userId = await resolveUserIdForSubscription(subscription, userIdHint);

  if (!stripeCustomerId) {
    throw new Error(`Stripe subscription ${subscription.id} is missing customer`);
  }

  if (!userId) {
    throw new Error(`No local user found for Stripe subscription ${subscription.id}`);
  }

  const syncedSubscription: DbSubscription = await prisma.subscription.upsert({
    create: {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: stripeTimestampToDate(subscription.canceled_at),
      currentPeriodEnd: stripeTimestampToDate(
        subscriptionItem?.current_period_end ?? null,
      ),
      currentPeriodStart: stripeTimestampToDate(
        subscriptionItem?.current_period_start ?? null,
      ),
      plan,
      status: mapStripeSubscriptionStatus(subscription.status),
      stripeCustomerId,
      stripePriceId,
      stripeSubscriptionId: subscription.id,
      trialEndsAt: stripeTimestampToDate(subscription.trial_end),
      userId,
    },
    update: {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: stripeTimestampToDate(subscription.canceled_at),
      currentPeriodEnd: stripeTimestampToDate(
        subscriptionItem?.current_period_end ?? null,
      ),
      currentPeriodStart: stripeTimestampToDate(
        subscriptionItem?.current_period_start ?? null,
      ),
      plan,
      status: mapStripeSubscriptionStatus(subscription.status),
      stripeCustomerId,
      stripePriceId,
      stripeSubscriptionId: subscription.id,
      trialEndsAt: stripeTimestampToDate(subscription.trial_end),
    },
    where: {
      userId,
    },
  });

  return {
    plan: syncedSubscription.plan,
    status: syncedSubscription.status,
    stripeCustomerId,
    stripePriceId,
    stripeSubscriptionId: syncedSubscription.stripeSubscriptionId ?? subscription.id,
    userId,
  };
}

export async function createInvoiceTaskFromPaidInvoice(
  invoice: Stripe.Invoice,
  stripeEventId: string,
): Promise<InvoiceTask> {
  const subscription = await getInvoiceSubscription(invoice);
  const syncedSubscription = subscription
    ? await syncSubscriptionFromStripeSubscription(subscription)
    : null;
  const stripeCustomerId =
    getStripeObjectId(invoice.customer) ?? syncedSubscription?.stripeCustomerId ?? null;
  const stripeSubscriptionId =
    subscription?.id ?? syncedSubscription?.stripeSubscriptionId ?? null;
  const userId =
    syncedSubscription?.userId ??
    (await resolveUserIdFromStripeRefs({
      stripeCustomerId,
      stripeSubscriptionId,
    }));

  if (!userId) {
    throw new Error(`No local user found for Stripe invoice ${invoice.id}`);
  }

  const billingProfile = await prisma.billingProfile.findUnique({
    where: {
      userId,
    },
  });
  const invoiceTask = prepareInvoiceTaskFromBillingProfile(billingProfile);

  return prisma.invoiceTask.upsert({
    create: {
      amountPaid: (invoice.amount_paid / 100).toFixed(2),
      billingSnapshot: invoiceTask.billingSnapshot,
      currency: invoice.currency.toUpperCase(),
      customerType: invoiceTask.customerType,
      periodEnd: stripeTimestampToDate(invoice.period_end),
      periodStart: stripeTimestampToDate(invoice.period_start),
      status: invoiceTask.status,
      stripeCustomerId,
      stripeEventId,
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId,
      userId,
    },
    update: {
      stripeEventId,
    },
    where: {
      stripeInvoiceId: invoice.id,
    },
  });
}

async function processCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const subscription = await retrieveCheckoutSubscription(session);

  if (!subscription) {
    return;
  }

  await syncSubscriptionFromStripeSubscription(
    subscription,
    session.metadata?.userId ?? null,
  );
}

async function processInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscription = await getInvoiceSubscription(invoice);

  if (!subscription) {
    return;
  }

  await syncSubscriptionFromStripeSubscription(subscription);
}

async function processStripeEventByType(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await processCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscriptionFromStripeSubscription(
        event.data.object as Stripe.Subscription,
      );
      return;
    case "invoice.paid":
      await createInvoiceTaskFromPaidInvoice(
        event.data.object as Stripe.Invoice,
        event.id,
      );
      return;
    case "invoice.payment_failed":
      await processInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      return;
    default:
      return;
  }
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
): Promise<ProcessStripeWebhookEventResult> {
  const billingEvent = await prisma.billingEvent.upsert({
    create: {
      eventType: event.type,
      payload: toInputJsonValue(event),
      stripeEventId: event.id,
    },
    update: {
      eventType: event.type,
      payload: toInputJsonValue(event),
    },
    where: {
      stripeEventId: event.id,
    },
  });

  if (billingEvent.processedAt) {
    return {
      billingEventId: billingEvent.id,
      duplicate: true,
      eventType: billingEvent.eventType,
    };
  }

  try {
    await processStripeEventByType(event);
    await markBillingEventProcessed(billingEvent.id);

    return {
      billingEventId: billingEvent.id,
      duplicate: false,
      eventType: event.type,
    };
  } catch (error: unknown) {
    await markBillingEventFailed({
      billingEventId: billingEvent.id,
      error,
    });

    throw error;
  }
}
