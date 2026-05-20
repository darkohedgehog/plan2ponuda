import "server-only";

import type {
  InvoiceTask as DbInvoiceTask,
  Subscription as DbSubscription,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  getMissingBillingProfileFields,
  type InvoiceTaskFiltersInput,
  type UpdateInvoiceTaskInput,
} from "@/lib/validations/billing.schema";
import type {
  AdminInvoiceTask,
  AdminInvoiceTaskBillingSnapshot,
  AdminInvoiceTaskQueue,
  AdminInvoiceTaskSummary,
  AdminInvoiceTaskSummaryStatus,
  BillingProfile,
  BillingProfileFieldKey,
  CustomerType,
  InvoiceTaskStatus,
} from "@/types/billing";

type DbInvoiceTaskWithUser = DbInvoiceTask & {
  user: {
    email: string;
    subscription: Pick<DbSubscription, "plan" | "status"> | null;
  };
};

type UpdateInvoiceTaskResult =
  | {
      ok: true;
      task: AdminInvoiceTask;
    }
  | {
      ok: false;
      reason:
        | "invoice_task_not_found"
        | "issued_status_locked"
        | "synesis_invoice_number_required";
    };

const summaryStatuses: AdminInvoiceTaskSummaryStatus[] = [
  "pending",
  "needs_review",
  "issued",
  "failed",
];

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function isJsonRecord(
  value: Prisma.JsonValue | undefined,
): value is Record<string, Prisma.JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringValue(
  record: Record<string, Prisma.JsonValue>,
  key: string,
): string | null {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getRequiredStringValue(
  record: Record<string, Prisma.JsonValue>,
  key: string,
): string {
  return getStringValue(record, key) ?? "";
}

function isCustomerType(value: string | null): value is CustomerType {
  return (
    value === "croatian_individual" ||
    value === "croatian_business_b2b" ||
    value === "croatian_b2g" ||
    value === "eu_business" ||
    value === "eu_b2g_needs_review" ||
    value === "outside_eu"
  );
}

function isBillingProfileFieldKey(
  value: Prisma.JsonValue,
): value is BillingProfileFieldKey {
  return (
    value === "billingAddressLine1" ||
    value === "billingAddressLine2" ||
    value === "billingCity" ||
    value === "billingCountry" ||
    value === "billingEmail" ||
    value === "billingName" ||
    value === "billingPostalCode" ||
    value === "companyName" ||
    value === "contactPerson" ||
    value === "customerType" ||
    value === "eInvoiceReference" ||
    value === "notes" ||
    value === "oib" ||
    value === "phone" ||
    value === "procurementReference" ||
    value === "purchaseOrderNumber" ||
    value === "taxId" ||
    value === "vatId"
  );
}

function isSummaryStatus(
  status: InvoiceTaskStatus,
): status is AdminInvoiceTaskSummaryStatus {
  return summaryStatuses.includes(status as AdminInvoiceTaskSummaryStatus);
}

function getSnapshotBillingProfile(
  snapshotRecord: Record<string, Prisma.JsonValue>,
  fallbackCustomerType: CustomerType,
): BillingProfile | null {
  const profileRecord = snapshotRecord.billingProfile;

  if (!isJsonRecord(profileRecord)) {
    return null;
  }

  const customerTypeValue = getStringValue(profileRecord, "customerType");

  return {
    billingAddressLine1: getRequiredStringValue(
      profileRecord,
      "billingAddressLine1",
    ),
    billingAddressLine2: getStringValue(profileRecord, "billingAddressLine2"),
    billingCity: getRequiredStringValue(profileRecord, "billingCity"),
    billingCountry: getRequiredStringValue(profileRecord, "billingCountry"),
    billingEmail: getRequiredStringValue(profileRecord, "billingEmail"),
    billingName: getRequiredStringValue(profileRecord, "billingName"),
    billingPostalCode: getRequiredStringValue(
      profileRecord,
      "billingPostalCode",
    ),
    companyName: getStringValue(profileRecord, "companyName"),
    contactPerson: getStringValue(profileRecord, "contactPerson"),
    customerType: isCustomerType(customerTypeValue)
      ? customerTypeValue
      : fallbackCustomerType,
    eInvoiceReference: getStringValue(profileRecord, "eInvoiceReference"),
    notes: getStringValue(profileRecord, "notes"),
    oib: getStringValue(profileRecord, "oib"),
    phone: getStringValue(profileRecord, "phone"),
    procurementReference: getStringValue(profileRecord, "procurementReference"),
    purchaseOrderNumber: getStringValue(profileRecord, "purchaseOrderNumber"),
    taxId: getStringValue(profileRecord, "taxId"),
    vatId: getStringValue(profileRecord, "vatId"),
  };
}

function getSnapshotMissingFields(
  snapshotRecord: Record<string, Prisma.JsonValue>,
): BillingProfileFieldKey[] {
  const missingFields = snapshotRecord.missingFields;

  if (!Array.isArray(missingFields)) {
    return [];
  }

  return missingFields.filter(isBillingProfileFieldKey);
}

function mergeMissingFields(
  storedMissingFields: BillingProfileFieldKey[],
  derivedMissingFields: BillingProfileFieldKey[],
): BillingProfileFieldKey[] {
  return Array.from(new Set([...storedMissingFields, ...derivedMissingFields]));
}

function getSnapshotVersion(
  snapshotRecord: Record<string, Prisma.JsonValue>,
): number | null {
  const snapshotVersion = snapshotRecord.snapshotVersion;

  return typeof snapshotVersion === "number" ? snapshotVersion : null;
}

function mapBillingSnapshot(
  value: Prisma.JsonValue,
  fallbackCustomerType: CustomerType,
): AdminInvoiceTaskBillingSnapshot {
  if (!isJsonRecord(value)) {
    return {
      billingProfile: null,
      capturedAt: null,
      missingFields: [],
      snapshotVersion: null,
    };
  }
  const billingProfile = getSnapshotBillingProfile(value, fallbackCustomerType);

  return {
    billingProfile,
    capturedAt: getStringValue(value, "capturedAt"),
    missingFields: mergeMissingFields(
      getSnapshotMissingFields(value),
      billingProfile ? getMissingBillingProfileFields(billingProfile) : [],
    ),
    snapshotVersion: getSnapshotVersion(value),
  };
}

function mapInvoiceTask(task: DbInvoiceTaskWithUser): AdminInvoiceTask {
  const billingSnapshot = mapBillingSnapshot(
    task.billingSnapshot,
    task.customerType,
  );
  const billingProfile = billingSnapshot.billingProfile;

  return {
    adminNotes: task.adminNotes,
    amountPaid: task.amountPaid?.toFixed(2) ?? null,
    billingName: billingProfile?.billingName ?? null,
    billingSnapshot,
    companyName: billingProfile?.companyName ?? null,
    createdAt: task.createdAt.toISOString(),
    currency: task.currency,
    customerType: task.customerType,
    id: task.id,
    issuedAt: toIsoString(task.issuedAt),
    periodEnd: toIsoString(task.periodEnd),
    periodStart: toIsoString(task.periodStart),
    reviewedAt: toIsoString(task.reviewedAt),
    status: task.status,
    stripeCustomerId: task.stripeCustomerId,
    stripeInvoiceId: task.stripeInvoiceId,
    stripePaymentIntentId: task.stripePaymentIntentId,
    stripeSubscriptionId: task.stripeSubscriptionId,
    subscriptionPlan: task.user.subscription?.plan ?? null,
    subscriptionStatus: task.user.subscription?.status ?? null,
    synesisInvoiceNumber: task.synesisInvoiceNumber,
    updatedAt: task.updatedAt.toISOString(),
    userEmail: task.user.email,
  };
}

function getInvoiceTaskWhere(
  filters: InvoiceTaskFiltersInput,
): Prisma.InvoiceTaskWhereInput {
  return {
    customerType: filters.customerType,
    status: filters.status,
  };
}

function getEmptySummary(): AdminInvoiceTaskSummary {
  return {
    failed: 0,
    issued: 0,
    needs_review: 0,
    pending: 0,
  };
}

export async function getAdminInvoiceTaskQueue(
  filters: InvoiceTaskFiltersInput,
): Promise<AdminInvoiceTaskQueue> {
  const where = getInvoiceTaskWhere(filters);
  const summaryWhere: Prisma.InvoiceTaskWhereInput = {
    customerType: filters.customerType,
  };
  const [tasks, statusCounts] = await Promise.all([
    prisma.invoiceTask.findMany({
      include: {
        user: {
          select: {
            email: true,
            subscription: {
              select: {
                plan: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      take: 100,
      where,
    }),
    prisma.invoiceTask.groupBy({
      by: ["status"],
      where: summaryWhere,
      _count: {
        _all: true,
      },
    }),
  ]);
  const summary = getEmptySummary();

  for (const count of statusCounts) {
    if (isSummaryStatus(count.status)) {
      summary[count.status] = count._count._all;
    }
  }

  return {
    filters,
    summary,
    tasks: tasks.map(mapInvoiceTask),
  };
}

function hasInvoiceNumber(value: string | null): boolean {
  return value !== null && value.trim().length > 0;
}

export async function updateAdminInvoiceTask(
  invoiceTaskId: string,
  input: UpdateInvoiceTaskInput,
): Promise<UpdateInvoiceTaskResult> {
  const currentTask = await prisma.invoiceTask.findUnique({
    where: {
      id: invoiceTaskId,
    },
  });

  if (!currentTask) {
    return {
      ok: false,
      reason: "invoice_task_not_found",
    };
  }

  if (
    currentTask.status === "issued" &&
    input.status !== undefined &&
    input.status !== "issued"
  ) {
    return {
      ok: false,
      reason: "issued_status_locked",
    };
  }

  const nextStatus: InvoiceTaskStatus = input.status ?? currentTask.status;
  const nextSynesisInvoiceNumber =
    input.synesisInvoiceNumber !== undefined
      ? input.synesisInvoiceNumber
      : currentTask.synesisInvoiceNumber;

  if (nextStatus === "issued" && !hasInvoiceNumber(nextSynesisInvoiceNumber)) {
    return {
      ok: false,
      reason: "synesis_invoice_number_required",
    };
  }

  const data: Prisma.InvoiceTaskUpdateInput = {};

  if (input.adminNotes !== undefined) {
    data.adminNotes = input.adminNotes;
  }

  if (input.synesisInvoiceNumber !== undefined) {
    data.synesisInvoiceNumber = input.synesisInvoiceNumber;
  }

  if (input.status !== undefined) {
    const now = new Date();

    data.status = input.status;
    data.reviewedAt = now;
    data.issuedAt = input.status === "issued" ? currentTask.issuedAt ?? now : null;
  }

  const updatedTask = await prisma.invoiceTask.update({
    data,
    include: {
      user: {
        select: {
          email: true,
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
        },
      },
    },
    where: {
      id: invoiceTaskId,
    },
  });

  return {
    ok: true,
    task: mapInvoiceTask(updatedTask),
  };
}
