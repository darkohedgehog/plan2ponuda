import assert from "node:assert/strict";
import test from "node:test";

import {
  billingProfileSchema,
  checkoutBillingPlanSchema,
  customerTypeValues,
  getMissingBillingProfileFields,
} from "../src/lib/validations/billing.schema";
import {
  getStripeCustomerCreateParams,
  getStripeCustomerTaxIdParams,
  getStripeCustomerUpdateParams,
  getStripePriceIdForPlan,
} from "../src/server/services/billing-service";

const validBillingProfileInput = {
  billingAddressLine1: "Ilica 1",
  billingCity: "Zagreb",
  billingCountry: "HR",
  billingEmail: "billing@example.com",
  billingName: "Example Customer",
  billingPostalCode: "10000",
};

test("accepts the minimum required billing fields for each customer type", () => {
  const customerTypeSpecificFields = {
    croatian_b2g: {
      billingName: "",
      companyName: "City Office",
      oib: "12345678901",
    },
    croatian_business_b2b: {
      billingName: "",
      companyName: "Elektro Primjer d.o.o.",
      oib: "12345678901",
    },
    croatian_individual: {},
    eu_b2g_needs_review: {
      billingName: "",
      companyName: "EU Public Office",
    },
    eu_business: {
      billingName: "",
      companyName: "EU Example GmbH",
      vatId: "DE123456789",
    },
    outside_eu: {},
  };

  for (const customerType of customerTypeValues) {
    const result = billingProfileSchema.safeParse({
      ...validBillingProfileInput,
      ...customerTypeSpecificFields[customerType],
      customerType,
    });

    assert.equal(result.success, true, customerType);
  }
});

test("rejects missing common billing profile fields", () => {
  const result = billingProfileSchema.safeParse({
    customerType: "croatian_individual",
    billingEmail: "billing@example.com",
  });

  assert.equal(result.success, false);
});

test("normalizes empty optional billing profile fields to null", () => {
  const result = billingProfileSchema.parse({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "EU Public Office",
    customerType: "eu_b2g_needs_review",
    notes: "   ",
    vatId: "",
  });

  assert.equal(result.notes, null);
  assert.equal(result.vatId, null);
});

test("does not require tax identifiers for Croatian individuals", () => {
  const result = billingProfileSchema.safeParse({
    ...validBillingProfileInput,
    customerType: "croatian_individual",
  });

  assert.equal(result.success, true);
});

test("requires company name and OIB for Croatian business customers", () => {
  const missingFields = getMissingBillingProfileFields({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "",
    customerType: "croatian_business_b2b",
    oib: "",
  });

  assert.deepEqual(missingFields, ["companyName", "oib"]);
});

test("uses company name as billing name for company profiles", () => {
  const result = billingProfileSchema.parse({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "Elektro Primjer d.o.o.",
    customerType: "croatian_business_b2b",
    oib: "12345678901",
  });

  assert.equal(result.billingName, "Elektro Primjer d.o.o.");
});

test("requires VAT ID for EU business customers", () => {
  const missingFields = getMissingBillingProfileFields({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "EU Example GmbH",
    customerType: "eu_business",
    vatId: "",
  });

  assert.deepEqual(missingFields, ["vatId"]);
});

test("keeps public-sector references optional for B2G profiles", () => {
  const result = billingProfileSchema.safeParse({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "City Utility Office",
    customerType: "croatian_b2g",
    oib: "12345678901",
  });

  assert.equal(result.success, true);
});

test("checkout plan validation only accepts paid self-serve plans", () => {
  assert.equal(checkoutBillingPlanSchema.safeParse("basic").success, true);
  assert.equal(checkoutBillingPlanSchema.safeParse("pro").success, true);
  assert.equal(checkoutBillingPlanSchema.safeParse("free").success, false);
});

test("maps paid plans to the configured Stripe price IDs", () => {
  const priceEnv = {
    stripeBasicPriceId: "price_basic_test",
    stripeProPriceId: "price_pro_test",
  };

  assert.equal(
    getStripePriceIdForPlan("basic", priceEnv),
    "price_basic_test",
  );
  assert.equal(getStripePriceIdForPlan("pro", priceEnv), "price_pro_test");
});

test("builds Stripe customer payload from billing profile details", () => {
  const profile = billingProfileSchema.parse({
    ...validBillingProfileInput,
    billingAddressLine2: "Office 2",
    billingName: "",
    companyName: "Elektro Primjer d.o.o.",
    customerType: "croatian_business_b2b",
    oib: "90344764519",
    phone: "+385 32 123 456",
  });

  assert.deepEqual(getStripeCustomerCreateParams("user_123", profile), {
    address: {
      city: "Zagreb",
      country: "HR",
      line1: "Ilica 1",
      line2: "Office 2",
      postal_code: "10000",
    },
    email: "billing@example.com",
    metadata: {
      userId: "user_123",
    },
    name: "Elektro Primjer d.o.o.",
    phone: "+385 32 123 456",
  });

  assert.deepEqual(getStripeCustomerUpdateParams("user_123", profile), {
    address: {
      city: "Zagreb",
      country: "HR",
      line1: "Ilica 1",
      line2: "Office 2",
      postal_code: "10000",
    },
    email: "billing@example.com",
    metadata: {
      userId: "user_123",
    },
    name: "Elektro Primjer d.o.o.",
    phone: "+385 32 123 456",
  });
});

test("selects safe Stripe tax IDs from billing profiles", () => {
  const euProfile = billingProfileSchema.parse({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "EU Example GmbH",
    customerType: "eu_business",
    vatId: "de 123456789",
  });
  const croatianProfile = billingProfileSchema.parse({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "Elektro Primjer d.o.o.",
    customerType: "croatian_business_b2b",
    oib: "90344764519",
  });
  const rawOibOnlyProfile = billingProfileSchema.parse({
    ...validBillingProfileInput,
    billingName: "",
    companyName: "Elektro Primjer d.o.o.",
    customerType: "croatian_business_b2b",
    oib: "90344764519",
    vatId: "90344764519",
  });

  assert.deepEqual(getStripeCustomerTaxIdParams(euProfile), {
    type: "eu_vat",
    value: "DE123456789",
  });
  assert.deepEqual(getStripeCustomerTaxIdParams(croatianProfile), {
    type: "hr_oib",
    value: "90344764519",
  });
  assert.deepEqual(getStripeCustomerTaxIdParams(rawOibOnlyProfile), {
    type: "hr_oib",
    value: "90344764519",
  });
});
