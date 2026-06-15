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

export type InvoiceTaskStatus =
  | "pending"
  | "issued"
  | "failed"
  | "needs_review"
  | "not_required";

export type UsageCounterType =
  | "floor_plans_created"
  | "quotes_created"
  | "large_pdf_analyses_used";

export type BillingFeature = "floorPlans" | "quotes" | "largePdfAnalyses";

export type BillingProfileFieldKey =
  | "billingAddressLine1"
  | "billingAddressLine2"
  | "billingCity"
  | "billingCountry"
  | "billingEmail"
  | "billingName"
  | "billingPostalCode"
  | "companyName"
  | "contactPerson"
  | "customerType"
  | "eInvoiceReference"
  | "notes"
  | "oib"
  | "phone"
  | "procurementReference"
  | "purchaseOrderNumber"
  | "taxId"
  | "vatId";

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
  stripeCustomerId: string | null;
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
        missingFields?: BillingProfileFieldKey[];
      };
      ok: false;
    };

export type BillingCheckoutResponse =
  | {
      ok: true;
      url: string;
    }
  | {
      error: {
        code:
          | "billing_profile_incomplete"
          | "billing_profile_required"
          | "invalid_input"
          | "rate_limited"
          | "server_error";
        message: string;
        missingFields?: BillingProfileFieldKey[];
      };
      ok: false;
    };

export type BillingPortalResponse =
  | {
      ok: true;
      url: string;
    }
  | {
      error: {
        code: "rate_limited" | "server_error" | "stripe_customer_required";
        message: string;
      };
      ok: false;
    };

export type AdminInvoiceTaskBillingSnapshot = {
  billingProfile: BillingProfile | null;
  capturedAt: string | null;
  missingFields: BillingProfileFieldKey[];
  snapshotVersion: number | null;
};

export type AdminInvoiceTask = {
  adminNotes: string | null;
  amountPaid: string | null;
  billingName: string | null;
  billingSnapshot: AdminInvoiceTaskBillingSnapshot;
  companyName: string | null;
  createdAt: string;
  currency: string;
  customerType: CustomerType;
  id: string;
  issuedAt: string | null;
  periodEnd: string | null;
  periodStart: string | null;
  reviewedAt: string | null;
  status: InvoiceTaskStatus;
  stripeCustomerId: string | null;
  stripeInvoiceId: string | null;
  stripePaymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionPlan: BillingPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
  synesisInvoiceNumber: string | null;
  updatedAt: string;
  userEmail: string;
};

export type AdminInvoiceTaskSummaryStatus =
  | "failed"
  | "issued"
  | "needs_review"
  | "pending";

export type AdminInvoiceTaskSummary = Record<
  AdminInvoiceTaskSummaryStatus,
  number
>;

export type AdminInvoiceTaskFilters = {
  customerType?: CustomerType;
  status?: InvoiceTaskStatus;
};

export type AdminInvoiceTaskQueue = {
  filters: AdminInvoiceTaskFilters;
  summary: AdminInvoiceTaskSummary;
  tasks: AdminInvoiceTask[];
};

export type UpdateAdminInvoiceTaskResponse =
  | {
      ok: true;
      task: AdminInvoiceTask;
    }
  | {
      error: {
        code:
          | "forbidden"
          | "invalid_input"
          | "invoice_task_not_found"
          | "issued_status_locked"
          | "server_error"
          | "synesis_invoice_number_required"
          | "unauthorized";
        message: string;
      };
      ok: false;
    };
