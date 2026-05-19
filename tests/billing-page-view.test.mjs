import assert from "node:assert/strict";
import test from "node:test";

import { getBillingActionVisibility } from "../src/lib/billing/billing-page-view.ts";

test("free users can upgrade to either paid plan", () => {
  assert.deepEqual(getBillingActionVisibility("free", false), {
    showManageSubscription: false,
    showUpgradeBasic: true,
    showUpgradePro: true,
  });
});

test("basic users can manage their subscription and upgrade to pro", () => {
  assert.deepEqual(getBillingActionVisibility("basic", false), {
    showManageSubscription: true,
    showUpgradeBasic: false,
    showUpgradePro: true,
  });
});

test("pro users only manage their subscription", () => {
  assert.deepEqual(getBillingActionVisibility("pro", false), {
    showManageSubscription: true,
    showUpgradeBasic: false,
    showUpgradePro: false,
  });
});

test("a Stripe customer can manage even when the effective plan is free", () => {
  assert.equal(getBillingActionVisibility("free", true).showManageSubscription, true);
});
