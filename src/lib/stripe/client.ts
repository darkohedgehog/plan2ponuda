import "server-only";

import Stripe from "stripe";

import { getStripeBillingEnv } from "@/lib/utils/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeBillingEnv().stripeSecretKey, {
      apiVersion: "2026-04-22.dahlia",
      appInfo: {
        name: "Plan2Ponuda",
      },
      typescript: true,
    });
  }

  return stripeClient;
}
