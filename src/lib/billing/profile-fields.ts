import type {
  BillingProfileFieldKey,
  CustomerType,
} from "@/types/billing";

export const requiredBillingProfileFieldsByCustomerType: Record<
  CustomerType,
  readonly BillingProfileFieldKey[]
> = {
  croatian_b2g: [
    "companyName",
    "billingEmail",
    "billingAddressLine1",
    "billingCity",
    "billingPostalCode",
    "billingCountry",
    "oib",
  ],
  croatian_business_b2b: [
    "companyName",
    "billingEmail",
    "billingAddressLine1",
    "billingCity",
    "billingPostalCode",
    "billingCountry",
    "oib",
  ],
  croatian_individual: [
    "billingName",
    "billingEmail",
    "billingAddressLine1",
    "billingCity",
    "billingPostalCode",
    "billingCountry",
  ],
  eu_b2g_needs_review: [
    "companyName",
    "billingEmail",
    "billingAddressLine1",
    "billingCity",
    "billingPostalCode",
    "billingCountry",
  ],
  eu_business: [
    "companyName",
    "billingEmail",
    "billingAddressLine1",
    "billingCity",
    "billingPostalCode",
    "billingCountry",
    "vatId",
  ],
  outside_eu: [
    "billingName",
    "billingEmail",
    "billingAddressLine1",
    "billingCity",
    "billingPostalCode",
    "billingCountry",
  ],
};

export function getRequiredBillingProfileFields(
  customerType: CustomerType,
): readonly BillingProfileFieldKey[] {
  return requiredBillingProfileFieldsByCustomerType[customerType];
}

export function usesCompanyBillingName(customerType: CustomerType): boolean {
  return (
    customerType === "croatian_business_b2b" ||
    customerType === "croatian_b2g" ||
    customerType === "eu_business" ||
    customerType === "eu_b2g_needs_review"
  );
}

export function usesPublicSectorReferences(customerType: CustomerType): boolean {
  return (
    customerType === "croatian_b2g" ||
    customerType === "eu_b2g_needs_review"
  );
}
