import { z } from "zod";

export const customerTypeValues = [
  "croatian_individual",
  "croatian_business_b2b",
  "croatian_b2g",
  "eu_business",
  "eu_b2g_needs_review",
  "outside_eu",
] as const;

const requiredTextSchema = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength);

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null));

export const customerTypeSchema = z.enum(customerTypeValues);

export const billingProfileSchema = z.object({
  billingAddressLine1: requiredTextSchema(240),
  billingAddressLine2: optionalTextSchema(240),
  billingCity: requiredTextSchema(120),
  billingCountry: requiredTextSchema(120),
  billingEmail: z.string().trim().email().max(120),
  billingName: requiredTextSchema(160),
  billingPostalCode: requiredTextSchema(40),
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

export const createBillingProfileSchema = billingProfileSchema;
export const updateBillingProfileSchema = billingProfileSchema;

export type CustomerTypeInput = z.infer<typeof customerTypeSchema>;
export type BillingProfileInput = z.infer<typeof billingProfileSchema>;
