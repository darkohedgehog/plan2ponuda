import assert from "node:assert/strict";
import test from "node:test";

import {
  billingProfileSchema,
  checkoutBillingPlanSchema,
  customerTypeValues,
  getMissingBillingProfileFields,
} from "../src/lib/validations/billing.schema";
import { getStripePriceIdForPlan } from "../src/server/services/billing-service";

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
