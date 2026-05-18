import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/client";
import { getStripeWebhookEnv } from "@/lib/utils/env";
import { processStripeWebhookEvent } from "@/server/services/stripe-webhook-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: "Missing Stripe signature.",
      },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let webhookSecret: string;

  try {
    webhookSecret = getStripeWebhookEnv().stripeWebhookSecret;
  } catch (error: unknown) {
    console.error("Stripe webhook secret is not configured", error);

    return NextResponse.json(
      {
        error: "Stripe webhook is not configured.",
      },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      {
        error: "Invalid Stripe signature.",
      },
      { status: 400 },
    );
  }

  try {
    await processStripeWebhookEvent(event);
  } catch (error: unknown) {
    console.error("Stripe webhook processing failed", {
      error,
      eventId: event.id,
      eventType: event.type,
    });

    return NextResponse.json(
      {
        error: "Stripe webhook processing failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    received: true,
  });
}
