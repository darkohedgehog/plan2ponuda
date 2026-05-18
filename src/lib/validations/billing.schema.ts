import { z } from "zod";

import {
  getRequiredBillingProfileFields,
  usesCompanyBillingName,
} from "@/lib/billing/profile-fields";
import type {
  BillingProfile,
  BillingProfileFieldKey,
} from "@/types/billing";

export const customerTypeValues = [
  "croatian_individual",
  "croatian_business_b2b",
  "croatian_b2g",
  "eu_business",
  "eu_b2g_needs_review",
  "outside_eu",
] as const;

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null));

const optionalEmailSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine(
    (value) => value === null || z.string().email().safeParse(value).success,
  );

export const customerTypeSchema = z.enum(customerTypeValues);
export const checkoutBillingPlanSchema = z.enum(["basic", "pro"]);

type BillingProfileBaseInput = z.infer<typeof billingProfileBaseSchema>;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMissingRequiredValue(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function getNormalizedBillingName(input: BillingProfileBaseInput): string {
  if (usesCompanyBillingName(input.customerType)) {
    return input.companyName ?? "";
  }

  return input.billingName ?? input.companyName ?? "";
}

function addRequiredFieldIssue(
  context: z.RefinementCtx,
  field: BillingProfileFieldKey,
) {
  context.addIssue({
    code: "custom",
    message: "Required field.",
    path: [field],
  });
}

export function getMissingBillingProfileFields(
  input: unknown,
): BillingProfileFieldKey[] {
  if (!isObjectRecord(input)) {
    return ["customerType"];
  }

  const customerTypeResult = customerTypeSchema.safeParse(input.customerType);

  if (!customerTypeResult.success) {
    return ["customerType"];
  }

  return getRequiredBillingProfileFields(customerTypeResult.data).filter((field) =>
    isMissingRequiredValue(input[field]),
  );
}

const billingProfileBaseSchema = z.object({
  billingAddressLine1: optionalTextSchema(240),
  billingAddressLine2: optionalTextSchema(240),
  billingCity: optionalTextSchema(120),
  billingCountry: optionalTextSchema(120),
  billingEmail: optionalEmailSchema,
  billingName: optionalTextSchema(160),
  billingPostalCode: optionalTextSchema(40),
  companyName: optionalTextSchema(160),
  contactPerson: optionalTextSchema(160),
  customerType: customerTypeSchema,
  eInvoiceReference: optionalTextSchema(120),
  notes: optionalTextSchema(1000),
  oib: optionalTextSchema(40),
  phone: optionalTextSchema(80),
  procurementReference: optionalTextSchema(120),
  purchaseOrderNumber: optionalTextSchema(120),
  taxId: optionalTextSchema(80),
  vatId: optionalTextSchema(80),
});

export const billingProfileSchema = billingProfileBaseSchema
  .superRefine((input, context) => {
    for (const field of getMissingBillingProfileFields(input)) {
      addRequiredFieldIssue(context, field);
    }
  })
  .transform(
    (input): BillingProfile => ({
      billingAddressLine1: input.billingAddressLine1 ?? "",
      billingAddressLine2: input.billingAddressLine2,
      billingCity: input.billingCity ?? "",
      billingCountry: input.billingCountry ?? "",
      billingEmail: input.billingEmail ?? "",
      billingName: getNormalizedBillingName(input),
      billingPostalCode: input.billingPostalCode ?? "",
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      customerType: input.customerType,
      eInvoiceReference: input.eInvoiceReference,
      notes: input.notes,
      oib: input.oib,
      phone: input.phone,
      procurementReference: input.procurementReference,
      purchaseOrderNumber: input.purchaseOrderNumber,
      taxId: input.taxId,
      vatId: input.vatId,
    }),
  );

export const createBillingProfileSchema = billingProfileSchema;
export const updateBillingProfileSchema = billingProfileSchema;
export const createBillingCheckoutSessionSchema = z.object({
  plan: checkoutBillingPlanSchema,
});

export type CustomerTypeInput = z.infer<typeof customerTypeSchema>;
export type BillingProfileInput = z.infer<typeof billingProfileSchema>;
export type CheckoutBillingPlanInput = z.infer<
  typeof checkoutBillingPlanSchema
>;
export type CreateBillingCheckoutSessionInput = z.infer<
  typeof createBillingCheckoutSessionSchema
>;
