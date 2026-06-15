import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Subscription rows track the latest applied Stripe subscription event", () => {
  const schema = readSource("prisma/schema.prisma");
  const migration = readSource(
    "prisma/migrations/20260615090000_add_stripe_subscription_event_tracking/migration.sql",
  );

  assert.match(schema, /stripeLatestEventId\s+String\?/);
  assert.match(schema, /stripeLatestEventCreated\s+DateTime\?/);
  assert.match(schema, /@@index\(\[stripeLatestEventCreated\]\)/);
  assert.match(migration, /ADD COLUMN "stripeLatestEventId" TEXT/);
  assert.match(migration, /ADD COLUMN "stripeLatestEventCreated" TIMESTAMP\(3\)/);
});

test("Stripe subscription sync locks the local row and ignores equal or older events", () => {
  const source = readSource("src/server/services/stripe-webhook-service.ts");

  assert.match(source, /type StripeSubscriptionEventMetadata/);
  assert.match(source, /type SubscriptionEventStateRow/);
  assert.match(source, /function isStripeSubscriptionEventStale/);
  assert.match(source, /incomingCreatedAt\.getTime\(\) <= currentCreatedAt\.getTime\(\)/);
  assert.match(
    source,
    /SELECT id, "stripeLatestEventId", "stripeLatestEventCreated"[\s\S]*FROM "Subscription"[\s\S]*FOR UPDATE/,
  );
  assert.match(source, /stale:\s*true/);
  assert.match(source, /stripeLatestEventId/);
  assert.match(source, /stripeLatestEventCreated/);
});

test("customer.subscription webhooks pass Stripe event age into guarded sync", () => {
  const source = readSource("src/server/services/stripe-webhook-service.ts");

  assert.match(source, /case "customer\.subscription\.created":/);
  assert.match(source, /case "customer\.subscription\.updated":/);
  assert.match(source, /case "customer\.subscription\.deleted":/);
  assert.match(
    source,
    /syncSubscriptionFromStripeSubscription\([\s\S]*event\.data\.object as Stripe\.Subscription[\s\S]*\{\s*created:\s*event\.created,\s*id:\s*event\.id,\s*\}/,
  );
});

test("stale subscription events are processed idempotently without overwriting state", () => {
  const source = readSource("src/server/services/stripe-webhook-service.ts");

  assert.match(source, /ignored:\s*syncedSubscription\.stale/);
  assert.match(source, /await markBillingEventProcessed\(billingEvent\.id\)/);
  assert.match(source, /duplicate:\s*true/);
});
