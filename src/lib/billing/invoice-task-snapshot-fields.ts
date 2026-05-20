import type {
  BillingProfile,
  BillingProfileFieldKey,
  CustomerType,
} from "@/types/billing";

export type InvoiceTaskSnapshotFieldKey = Exclude<
  BillingProfileFieldKey,
  "customerType"
>;

export type InvoiceTaskSnapshotField = {
  isImportant: boolean;
  isMissing: boolean;
  key: InvoiceTaskSnapshotFieldKey;
  labelKey: InvoiceTaskSnapshotFieldKey;
  value: string | null;
};

type SnapshotFieldOptions = {
  isImportant?: boolean;
  isRequired?: boolean;
  showWhenEmpty?: boolean;
};

const companyCustomerTypes: readonly CustomerType[] = [
  "croatian_business_b2b",
  "croatian_b2g",
  "eu_business",
  "eu_b2g_needs_review",
];

const publicSectorCustomerTypes: readonly CustomerType[] = [
  "croatian_b2g",
  "eu_b2g_needs_review",
];

function isCompanyCustomerType(customerType: CustomerType): boolean {
  return companyCustomerTypes.includes(customerType);
}

function isCroatianBusinessCustomerType(customerType: CustomerType): boolean {
  return (
    customerType === "croatian_business_b2b" ||
    customerType === "croatian_b2g"
  );
}

function isPublicSectorCustomerType(customerType: CustomerType): boolean {
  return publicSectorCustomerTypes.includes(customerType);
}

function getFieldValue(
  profile: BillingProfile,
  key: InvoiceTaskSnapshotFieldKey,
): string | null {
  const value = profile[key];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function createSnapshotField(
  profile: BillingProfile,
  key: InvoiceTaskSnapshotFieldKey,
  options: SnapshotFieldOptions = {},
): InvoiceTaskSnapshotField | null {
  const value = getFieldValue(profile, key);
  const showWhenEmpty = options.showWhenEmpty ?? true;

  if (!showWhenEmpty && value === null) {
    return null;
  }

  return {
    isImportant: options.isImportant ?? false,
    isMissing: Boolean(options.isRequired && value === null),
    key,
    labelKey: key,
    value,
  };
}

function appendSnapshotField(
  fields: InvoiceTaskSnapshotField[],
  profile: BillingProfile,
  key: InvoiceTaskSnapshotFieldKey,
  options?: SnapshotFieldOptions,
) {
  const field = createSnapshotField(profile, key, options);

  if (field) {
    fields.push(field);
  }
}

function appendTaxIdentifierFields(
  fields: InvoiceTaskSnapshotField[],
  profile: BillingProfile,
) {
  if (isCroatianBusinessCustomerType(profile.customerType)) {
    appendSnapshotField(fields, profile, "oib", {
      isImportant: true,
      isRequired: true,
    });
    appendSnapshotField(fields, profile, "vatId", {
      showWhenEmpty: false,
    });
    return;
  }

  if (profile.customerType === "eu_business") {
    appendSnapshotField(fields, profile, "vatId", {
      isImportant: true,
      isRequired: true,
    });
    return;
  }

  if (profile.customerType === "eu_b2g_needs_review") {
    appendSnapshotField(fields, profile, "vatId", {
      showWhenEmpty: false,
    });
    return;
  }

  if (profile.customerType === "outside_eu") {
    appendSnapshotField(fields, profile, "taxId", {
      isImportant: true,
      showWhenEmpty: false,
    });
  }
}

function appendPublicSectorReferenceFields(
  fields: InvoiceTaskSnapshotField[],
  profile: BillingProfile,
) {
  if (!isPublicSectorCustomerType(profile.customerType)) {
    return;
  }

  appendSnapshotField(fields, profile, "purchaseOrderNumber");
  appendSnapshotField(fields, profile, "eInvoiceReference");
  appendSnapshotField(fields, profile, "procurementReference");
}

export function shouldShowEuB2gReviewNotice(customerType: CustomerType): boolean {
  return customerType === "eu_b2g_needs_review";
}

export function getInvoiceTaskSnapshotFields(
  profile: BillingProfile | null,
): InvoiceTaskSnapshotField[] {
  if (!profile) {
    return [];
  }

  const fields: InvoiceTaskSnapshotField[] = [];
  const isCompanyCustomer = isCompanyCustomerType(profile.customerType);
  const isPublicSectorCustomer = isPublicSectorCustomerType(
    profile.customerType,
  );

  appendSnapshotField(fields, profile, "billingName");
  appendSnapshotField(fields, profile, "companyName", {
    showWhenEmpty: isCompanyCustomer,
  });
  appendSnapshotField(fields, profile, "billingEmail");
  appendSnapshotField(fields, profile, "billingAddressLine1");
  appendSnapshotField(fields, profile, "billingAddressLine2", {
    showWhenEmpty: false,
  });
  appendSnapshotField(fields, profile, "billingCity");
  appendSnapshotField(fields, profile, "billingPostalCode");
  appendSnapshotField(fields, profile, "billingCountry");
  appendSnapshotField(fields, profile, "contactPerson", {
    showWhenEmpty: isPublicSectorCustomer,
  });
  appendTaxIdentifierFields(fields, profile);
  appendPublicSectorReferenceFields(fields, profile);
  appendSnapshotField(fields, profile, "notes", {
    showWhenEmpty: false,
  });

  return fields;
}
