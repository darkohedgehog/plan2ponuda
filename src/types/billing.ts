export type BillingPlan = "free" | "basic" | "pro";

export type SubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type CustomerType =
  | "croatian_individual"
  | "croatian_business_b2b"
  | "croatian_b2g"
  | "eu_business"
  | "eu_b2g_needs_review"
  | "outside_eu";

export type UsageCounterType =
  | "floor_plans_created"
  | "quotes_created"
  | "large_pdf_analyses_used";

export type BillingFeature = "floorPlans" | "quotes" | "largePdfAnalyses";

export type BillingProfile = {
  billingAddressLine1: string;
  billingAddressLine2: string | null;
  billingCity: string;
  billingCountry: string;
  billingEmail: string;
  billingName: string;
  billingPostalCode: string;
  companyName: string | null;
  contactPerson: string | null;
  customerType: CustomerType;
  eInvoiceReference: string | null;
  notes: string | null;
  oib: string | null;
  phone: string | null;
  procurementReference: string | null;
  purchaseOrderNumber: string | null;
  taxId: string | null;
  vatId: string | null;
};

export type SubscriptionSummary = {
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  plan: BillingPlan;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
};

export type UsageItem = {
  current: number;
  limit: number;
  type: UsageCounterType;
};

export type UsageSummary = {
  items: Record<BillingFeature, UsageItem>;
  periodEnd: string | null;
  periodKey: string;
  periodStart: string | null;
  plan: BillingPlan;
};

export type FeatureAccess = UsageItem & {
  allowed: boolean;
  feature: BillingFeature;
  plan: BillingPlan;
};

export type BillingProfileResponse =
  | {
      ok: true;
      profile: BillingProfile | null;
    }
  | {
      error: {
        code: "server_error" | "unauthorized";
        message: string;
      };
      ok: false;
    };

export type SaveBillingProfileResponse =
  | {
      ok: true;
      profile: BillingProfile;
    }
  | {
      error: {
        code: "invalid_input" | "server_error" | "unauthorized";
        message: string;
      };
      ok: false;
    };
