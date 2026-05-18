import assert from "node:assert/strict";
import test from "node:test";

import {
  mapStripePriceToBillingPlan,
  mapStripeSubscriptionStatus,
  stripeTimestampToDate,
} from "../src/server/services/stripe-webhook-service";

const priceEnv = {
  stripeBasicPriceId: "price_basic_test",
  stripeProPriceId: "price_pro_test",
};

test("maps configured Stripe prices to local billing plans", () => {
  assert.equal(
    mapStripePriceToBillingPlan("price_basic_test", priceEnv),
    "basic",
  );
  assert.equal(mapStripePriceToBillingPlan("price_pro_test", priceEnv), "pro");
});

test("does not grant paid access for unknown Stripe prices", () => {
  assert.equal(mapStripePriceToBillingPlan("price_unknown", priceEnv), null);
  assert.equal(mapStripePriceToBillingPlan(null, priceEnv), null);
});

test("normalizes Stripe subscription statuses to local statuses", () => {
  assert.equal(mapStripeSubscriptionStatus("incomplete"), "incomplete");
  assert.equal(
    mapStripeSubscriptionStatus("incomplete_expired"),
    "incomplete",
  );
  assert.equal(mapStripeSubscriptionStatus("trialing"), "trialing");
  assert.equal(mapStripeSubscriptionStatus("active"), "active");
  assert.equal(mapStripeSubscriptionStatus("past_due"), "past_due");
  assert.equal(mapStripeSubscriptionStatus("canceled"), "canceled");
  assert.equal(mapStripeSubscriptionStatus("unpaid"), "unpaid");
  assert.equal(mapStripeSubscriptionStatus("paused"), "paused");
});

test("converts Stripe unix timestamps to dates", () => {
  assert.equal(stripeTimestampToDate(1_700_000_000)?.toISOString(), "2023-11-14T22:13:20.000Z");
  assert.equal(stripeTimestampToDate(null), null);
});
