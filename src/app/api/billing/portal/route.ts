import { NextResponse } from "next/server";

import { getLocaleFromRequest } from "@/i18n/request-locale";
import { requireApiUser } from "@/lib/auth/guards";
import { createBillingPortalSession } from "@/server/services/billing-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type { BillingPortalResponse } from "@/types/billing";

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    await checkRateLimitOrThrow({
      key: createUserRateLimitKey({
        userId: auth.user.id,
      }),
      scope: RATE_LIMIT_SCOPES.billingPortal,
      ...RATE_LIMIT_POLICIES.billingPortal,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: BillingPortalResponse = {
        error: {
          code: "rate_limited",
          message: "Too many billing portal requests. Please try again later.",
        },
        ok: false,
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    console.error("Billing portal rate limit failed", error);

    const response: BillingPortalResponse = {
      error: {
        code: "server_error",
        message: "Unable to open billing portal.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const result = await createBillingPortalSession({
    locale: getLocaleFromRequest(request),
    userId: auth.user.id,
  }).catch((error: unknown) => {
    console.error("Stripe billing portal session creation failed", error);

    return null;
  });

  if (!result) {
    const response: BillingPortalResponse = {
      error: {
        code: "server_error",
        message: "Unable to open billing portal.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  if (!result.ok) {
    const response: BillingPortalResponse = {
      error: {
        code: "stripe_customer_required",
        message: "No Stripe customer exists for this account.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 409 });
  }

  const response: BillingPortalResponse = {
    ok: true,
    url: result.url,
  };

  return NextResponse.json(response);
}
