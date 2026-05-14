import assert from "node:assert/strict";
import test from "node:test";

import {
  billingProfileSchema,
  customerTypeValues,
} from "../src/lib/validations/billing.schema";

const validBillingProfileInput = {
  billingAddressLine1: "Ilica 1",
  billingCity: "Zagreb",
  billingCountry: "HR",
  billingEmail: "billing@example.com",
  billingName: "Example Customer",
  billingPostalCode: "10000",
};

test("accepts the minimum required billing fields for each customer type", () => {
  for (const customerType of customerTypeValues) {
    const result = billingProfileSchema.safeParse({
      ...validBillingProfileInput,
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
