import { NextResponse } from "next/server";

import { getLocaleFromRequest } from "@/i18n/request-locale";
import { requireApiUser } from "@/lib/auth/guards";
import { createBillingPortalSession } from "@/server/services/billing-service";
import type { BillingPortalResponse } from "@/types/billing";

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
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
