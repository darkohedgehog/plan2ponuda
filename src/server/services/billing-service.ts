import "server-only";

import type {
  BillingProfile as DbBillingProfile,
  Subscription as DbSubscription,
} from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { BillingProfileInput } from "@/lib/validations/billing.schema";
import {
  BILLING_PLAN_LIMITS,
  canUsePlanFeature,
  getFeatureForUsageCounterType,
  getUsageCounterTypeForFeature,
  usageCounterTypeValues,
  type BillingFeature,
  type BillingPlanValue,
  type UsageCounterTypeValue,
} from "@/server/services/billing-limits";
import type {
  BillingProfile,
  FeatureAccess,
  SubscriptionSummary,
  UsageSummary,
} from "@/types/billing";

const LIFETIME_PERIOD_KEY = "lifetime";

type UsagePeriod = {
  key: string;
  periodEnd: Date | null;
  periodStart: Date | null;
};

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function mapBillingProfile(profile: DbBillingProfile): BillingProfile {
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

function mapSubscription(
  subscription: DbSubscription,
): SubscriptionSummary {
  return {
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: toIsoString(subscription.canceledAt),
    currentPeriodEnd: toIsoString(subscription.currentPeriodEnd),
    currentPeriodStart: toIsoString(subscription.currentPeriodStart),
    plan: subscription.plan,
    status: subscription.status,
    trialEndsAt: toIsoString(subscription.trialEndsAt),
  };
}

function subscriptionHasPaidAccess(
  subscription: DbSubscription | null,
  now: Date,
): boolean {
  if (!subscription || subscription.plan === "free") {
    return false;
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    return true;
  }

  const currentPeriodEnd = subscription.currentPeriodEnd;

  return (
    subscription.status === "canceled" &&
    subscription.cancelAtPeriodEnd &&
    currentPeriodEnd !== null &&
    currentPeriodEnd.getTime() > now.getTime()
  );
}

function getEffectivePlanFromSubscription(
  subscription: DbSubscription | null,
  now = new Date(),
): BillingPlanValue {
  if (!subscriptionHasPaidAccess(subscription, now) || !subscription) {
    return "free";
  }

  return subscription.plan;
}

function getUsagePeriod(
  subscription: DbSubscription | null,
  plan: BillingPlanValue,
): UsagePeriod {
  if (
    plan === "free" ||
    !subscription?.currentPeriodStart ||
    !subscription.currentPeriodEnd
  ) {
    return {
      key: LIFETIME_PERIOD_KEY,
      periodEnd: null,
      periodStart: null,
    };
  }

  return {
    key: `${subscription.currentPeriodStart.toISOString()}_${subscription.currentPeriodEnd.toISOString()}`,
    periodEnd: subscription.currentPeriodEnd,
    periodStart: subscription.currentPeriodStart,
  };
}

export async function getBillingProfile(
  userId: string,
): Promise<BillingProfile | null> {
  const profile = await prisma.billingProfile.findUnique({
    where: {
      userId,
    },
  });

  return profile ? mapBillingProfile(profile) : null;
}

export async function upsertBillingProfile(
  userId: string,
  input: BillingProfileInput,
): Promise<BillingProfile> {
  const profile = await prisma.billingProfile.upsert({
    create: {
      ...input,
      userId,
    },
    update: input,
    where: {
      userId,
    },
  });

  return mapBillingProfile(profile);
}

export async function getSubscription(
  userId: string,
): Promise<SubscriptionSummary | null> {
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  return subscription ? mapSubscription(subscription) : null;
}

export async function getEffectivePlan(
  userId: string,
): Promise<BillingPlanValue> {
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  return getEffectivePlanFromSubscription(subscription);
}

export async function getUsageForCurrentPeriod(
  userId: string,
): Promise<UsageSummary> {
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });
  const plan = getEffectivePlanFromSubscription(subscription);
  const period = getUsagePeriod(subscription, plan);
  const counters = await prisma.usageCounter.findMany({
    where: {
      periodKey: period.key,
      type: {
        in: Array.from(usageCounterTypeValues),
      },
      userId,
    },
    select: {
      count: true,
      type: true,
    },
  });
  const countsByType = new Map<UsageCounterTypeValue, number>(
    counters.map((counter) => [counter.type, counter.count]),
  );

  return {
    items: {
      floorPlans: {
        current: countsByType.get("floor_plans_created") ?? 0,
        limit: BILLING_PLAN_LIMITS[plan].floorPlans,
        type: "floor_plans_created",
      },
      largePdfAnalyses: {
        current: countsByType.get("large_pdf_analyses_used") ?? 0,
        limit: BILLING_PLAN_LIMITS[plan].largePdfAnalyses,
        type: "large_pdf_analyses_used",
      },
      quotes: {
        current: countsByType.get("quotes_created") ?? 0,
        limit: BILLING_PLAN_LIMITS[plan].quotes,
        type: "quotes_created",
      },
    },
    periodEnd: toIsoString(period.periodEnd),
    periodKey: period.key,
    periodStart: toIsoString(period.periodStart),
    plan,
  };
}

export async function canUseFeature(
  userId: string,
  feature: BillingFeature,
): Promise<FeatureAccess> {
  const usage = await getUsageForCurrentPeriod(userId);
  const item = usage.items[feature];

  return {
    ...item,
    allowed: canUsePlanFeature({
      feature,
      plan: usage.plan,
      usage: item.current,
    }),
    feature,
    plan: usage.plan,
  };
}

export async function incrementUsage(
  userId: string,
  type: UsageCounterTypeValue,
): Promise<FeatureAccess> {
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });
  const plan = getEffectivePlanFromSubscription(subscription);
  const period = getUsagePeriod(subscription, plan);
  const feature = getFeatureForUsageCounterType(type);
  const counter = await prisma.usageCounter.upsert({
    create: {
      count: 1,
      periodEnd: period.periodEnd,
      periodKey: period.key,
      periodStart: period.periodStart,
      type,
      userId,
    },
    update: {
      count: {
        increment: 1,
      },
      periodEnd: period.periodEnd,
      periodStart: period.periodStart,
    },
    where: {
      userId_type_periodKey: {
        periodKey: period.key,
        type,
        userId,
      },
    },
  });
  const current = counter.count;
  const limit = BILLING_PLAN_LIMITS[plan][feature];

  return {
    allowed: canUsePlanFeature({
      feature,
      plan,
      usage: current,
    }),
    current,
    feature,
    limit,
    plan,
    type,
  };
}

export { getUsageCounterTypeForFeature };
