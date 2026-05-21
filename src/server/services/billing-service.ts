import "server-only";

import type {
  BillingProfile as DbBillingProfile,
  Subscription as DbSubscription,
} from "../../../generated/prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";
import { getStripeClient } from "@/lib/stripe/client";
import { getStripeBillingEnv } from "@/lib/utils/env";
import {
  billingProfileSchema,
  getMissingBillingProfileFields,
} from "@/lib/validations/billing.schema";
import type {
  BillingProfileInput,
  CheckoutBillingPlanInput,
} from "@/lib/validations/billing.schema";
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
  BillingProfileFieldKey,
  FeatureAccess,
  SubscriptionSummary,
  UsageSummary,
} from "@/types/billing";
import type { Locale } from "@/i18n/routing";

const LIFETIME_PERIOD_KEY = "lifetime";

type UsagePeriod = {
  key: string;
  periodEnd: Date | null;
  periodStart: Date | null;
};

type UsageCounterWriteClient = Pick<
  typeof prisma,
  "subscription" | "usageCounter"
>;

type UsageCounterReadClient = UsageCounterWriteClient;

type StripeBillingPriceEnv = {
  stripeBasicPriceId: string;
  stripeProPriceId: string;
};

type StripeCustomerResult =
  | {
      ok: true;
      stripeCustomerId: string;
    }
  | {
      missingFields?: BillingProfileFieldKey[];
      ok: false;
      reason:
        | "billing_profile_incomplete"
        | "billing_profile_missing"
        | "user_missing";
    };

type CreateCheckoutSessionInput = {
  locale: Locale;
  plan: CheckoutBillingPlanInput;
  userId: string;
};

type CreateCheckoutSessionResult =
  | {
      ok: true;
      url: string;
    }
  | {
      missingFields?: BillingProfileFieldKey[];
      ok: false;
      reason:
        | "billing_profile_incomplete"
        | "billing_profile_missing"
        | "stripe_session_url_missing"
        | "user_missing";
    };

type CreatePortalSessionInput = {
  locale: Locale;
  userId: string;
};

type CreatePortalSessionResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      reason: "stripe_customer_missing";
    };

export class UsageLimitExceededError extends Error {
  readonly access: FeatureAccess;
  readonly type: UsageCounterTypeValue;

  constructor(access: FeatureAccess) {
    super(`Usage limit exceeded for ${access.type}.`);
    this.name = "UsageLimitExceededError";
    this.access = access;
    this.type = access.type;
  }
}

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
    stripeCustomerId: subscription.stripeCustomerId,
    trialEndsAt: toIsoString(subscription.trialEndsAt),
  };
}

function getBillingPageUrl(
  appUrl: string,
  locale: Locale,
  checkoutResult?: "cancelled" | "success",
): string {
  const url = new URL(`/${locale}/dashboard/billing`, appUrl);

  if (checkoutResult) {
    url.searchParams.set("checkout", checkoutResult);
  }

  return url.toString();
}

function getStripeCustomerAddress(
  profile: BillingProfileInput,
): Stripe.AddressParam {
  return {
    city: profile.billingCity,
    country: profile.billingCountry,
    line1: profile.billingAddressLine1,
    line2: profile.billingAddressLine2 ?? undefined,
    postal_code: profile.billingPostalCode,
  };
}

function getStripeCustomerParams(
  userId: string,
  profile: BillingProfileInput,
): Stripe.CustomerCreateParams {
  return {
    address: getStripeCustomerAddress(profile),
    email: profile.billingEmail,
    metadata: {
      userId,
    },
    name: profile.billingName,
    phone: profile.phone ?? undefined,
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

export function getStripePriceIdForPlan(
  plan: CheckoutBillingPlanInput,
  env: StripeBillingPriceEnv = getStripeBillingEnv(),
): string {
  switch (plan) {
    case "basic":
      return env.stripeBasicPriceId;
    case "pro":
      return env.stripeProPriceId;
  }
}

export async function updateSubscriptionStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<SubscriptionSummary> {
  const subscription = await prisma.subscription.upsert({
    create: {
      plan: "free",
      status: "active",
      stripeCustomerId,
      userId,
    },
    update: {
      stripeCustomerId,
    },
    where: {
      userId,
    },
  });

  return mapSubscription(subscription);
}

export async function getOrCreateStripeCustomerForUser(
  userId: string,
): Promise<StripeCustomerResult> {
  const user = await prisma.user.findUnique({
    select: {
      billingProfile: true,
      subscription: {
        select: {
          stripeCustomerId: true,
        },
      },
    },
    where: {
      id: userId,
    },
  });

  if (!user) {
    return {
      ok: false,
      reason: "user_missing",
    };
  }

  const existingStripeCustomerId = user.subscription?.stripeCustomerId;

  if (existingStripeCustomerId) {
    return {
      ok: true,
      stripeCustomerId: existingStripeCustomerId,
    };
  }

  if (!user.billingProfile) {
    return {
      ok: false,
      reason: "billing_profile_missing",
    };
  }

  const parsedProfile = billingProfileSchema.safeParse(user.billingProfile);

  if (!parsedProfile.success) {
    return {
      missingFields: getMissingBillingProfileFields(user.billingProfile),
      ok: false,
      reason: "billing_profile_incomplete",
    };
  }

  const customer = await getStripeClient().customers.create(
    getStripeCustomerParams(userId, parsedProfile.data),
  );
  await updateSubscriptionStripeCustomerId(userId, customer.id);

  return {
    ok: true,
    stripeCustomerId: customer.id,
  };
}

export async function createBillingCheckoutSession({
  locale,
  plan,
  userId,
}: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
  const customerResult = await getOrCreateStripeCustomerForUser(userId);

  if (!customerResult.ok) {
    return customerResult;
  }

  const env = getStripeBillingEnv();
  const session = await getStripeClient().checkout.sessions.create({
    cancel_url: getBillingPageUrl(env.appUrl, locale, "cancelled"),
    customer: customerResult.stripeCustomerId,
    line_items: [
      {
        price: getStripePriceIdForPlan(plan, env),
        quantity: 1,
      },
    ],
    metadata: {
      plan,
      userId,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        plan,
        userId,
      },
    },
    success_url: getBillingPageUrl(env.appUrl, locale, "success"),
  });

  if (!session.url) {
    return {
      ok: false,
      reason: "stripe_session_url_missing",
    };
  }

  return {
    ok: true,
    url: session.url,
  };
}

export async function createBillingPortalSession({
  locale,
  userId,
}: CreatePortalSessionInput): Promise<CreatePortalSessionResult> {
  const subscription = await prisma.subscription.findUnique({
    select: {
      stripeCustomerId: true,
    },
    where: {
      userId,
    },
  });

  if (!subscription?.stripeCustomerId) {
    return {
      ok: false,
      reason: "stripe_customer_missing",
    };
  }

  const session = await getStripeClient().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: getBillingPageUrl(getStripeBillingEnv().appUrl, locale),
  });

  return {
    ok: true,
    url: session.url,
  };
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
  db: UsageCounterReadClient = prisma,
): Promise<UsageSummary> {
  const subscription = await db.subscription.findUnique({
    where: {
      userId,
    },
  });
  const plan = getEffectivePlanFromSubscription(subscription);
  const period = getUsagePeriod(subscription, plan);
  const counters = await db.usageCounter.findMany({
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
  db: UsageCounterReadClient = prisma,
): Promise<FeatureAccess> {
  const usage = await getUsageForCurrentPeriod(userId, db);
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
  db: UsageCounterWriteClient = prisma,
): Promise<FeatureAccess> {
  return consumeUsageOrThrow(db, userId, type);
}

export async function consumeUsageOrThrow(
  db: UsageCounterWriteClient,
  userId: string,
  type: UsageCounterTypeValue,
): Promise<FeatureAccess> {
  const subscription = await db.subscription.findUnique({
    where: {
      userId,
    },
  });
  const plan = getEffectivePlanFromSubscription(subscription);
  const period = getUsagePeriod(subscription, plan);
  const feature = getFeatureForUsageCounterType(type);
  const limit = BILLING_PLAN_LIMITS[plan][feature];

  await db.usageCounter.upsert({
    create: {
      count: 0,
      periodEnd: period.periodEnd,
      periodKey: period.key,
      periodStart: period.periodStart,
      type,
      userId,
    },
    update: {
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
  const updated = await db.usageCounter.updateMany({
    data: {
      count: {
        increment: 1,
      },
      periodEnd: period.periodEnd,
      periodStart: period.periodStart,
    },
    where: {
      count: {
        lt: limit,
      },
      periodKey: period.key,
      type,
      userId,
    },
  });

  if (updated.count !== 1) {
    const counter = await db.usageCounter.findUnique({
      select: {
        count: true,
      },
      where: {
        userId_type_periodKey: {
          periodKey: period.key,
          type,
          userId,
        },
      },
    });

    throw new UsageLimitExceededError({
      allowed: false,
      current: counter?.count ?? 0,
      feature,
      limit,
      plan,
      type,
    });
  }

  const counter = await db.usageCounter.findUniqueOrThrow({
    select: {
      count: true,
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

  return {
    allowed: true,
    current,
    feature,
    limit,
    plan,
    type,
  };
}

export { getUsageCounterTypeForFeature };
