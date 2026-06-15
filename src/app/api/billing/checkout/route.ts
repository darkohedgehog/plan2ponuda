import { NextResponse } from "next/server";

import { getLocaleFromRequest } from "@/i18n/request-locale";
import { requireApiUser } from "@/lib/auth/guards";
import { createBillingCheckoutSessionSchema } from "@/lib/validations/billing.schema";
import { createBillingCheckoutSession } from "@/server/services/billing-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type { BillingCheckoutResponse } from "@/types/billing";

const invalidInputResponse: BillingCheckoutResponse = {
  error: {
    code: "invalid_input",
    message: "Select a valid billing plan.",
  },
  ok: false,
};

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
      scope: RATE_LIMIT_SCOPES.billingCheckout,
      ...RATE_LIMIT_POLICIES.billingCheckout,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: BillingCheckoutResponse = {
        error: {
          code: "rate_limited",
          message: "Too many checkout requests. Please try again later.",
        },
        ok: false,
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    console.error("Billing checkout rate limit failed", error);

    const response: BillingCheckoutResponse = {
      error: {
        code: "server_error",
        message: "Unable to start checkout.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = createBillingCheckoutSessionSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const result = await createBillingCheckoutSession({
    locale: getLocaleFromRequest(request),
    plan: parsedInput.data.plan,
    userId: auth.user.id,
  }).catch((error: unknown) => {
    console.error("Stripe checkout session creation failed", error);

    return null;
  });

  if (!result) {
    const response: BillingCheckoutResponse = {
      error: {
        code: "server_error",
        message: "Unable to start checkout.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  if (!result.ok) {
    if (result.reason === "billing_profile_incomplete") {
      const response: BillingCheckoutResponse = {
        error: {
          code: "billing_profile_incomplete",
          message: "Complete the required billing profile fields.",
          missingFields: result.missingFields,
        },
        ok: false,
      };

      return NextResponse.json(response, { status: 409 });
    }

    if (result.reason === "billing_profile_missing") {
      const response: BillingCheckoutResponse = {
        error: {
          code: "billing_profile_required",
          message: "Complete your billing profile before checkout.",
        },
        ok: false,
      };

      return NextResponse.json(response, { status: 409 });
    }

    const response: BillingCheckoutResponse = {
      error: {
        code: "server_error",
        message: "Unable to start checkout.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const response: BillingCheckoutResponse = {
    ok: true,
    url: result.url,
  };

  return NextResponse.json(response);
}
