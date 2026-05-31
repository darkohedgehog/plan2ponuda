import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { resendVerificationEmailForUser } from "@/server/services/auth-service";
import { getRateLimitHeaders } from "@/server/services/rate-limit-service";
import type { ResendEmailVerificationResponse } from "@/types/auth";

const alreadyVerifiedMessage = "Your email is already verified.";
const safeSentMessage = "If verification is needed, a new email has been sent.";

function getBaseUrl(request: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      console.error("Ignoring invalid NEXT_PUBLIC_APP_URL for email verification.");
    }
  }

  return new URL(request.url).origin;
}

function getStringProperty(input: unknown, property: string): string | null {
  if (!input || typeof input !== "object" || !(property in input)) {
    return null;
  }

  const value = (input as Record<string, unknown>)[property];

  return typeof value === "string" ? value : null;
}

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch((): unknown => null);
  const locale = getStringProperty(body, "locale");
  const result = await resendVerificationEmailForUser({
    baseUrl: getBaseUrl(request),
    locale,
    userId: auth.user.id,
  }).catch((error: unknown) => {
    console.error("Email verification resend failed", error);

    return null;
  });

  if (!result) {
    const response: ResendEmailVerificationResponse = {
      error: {
        code: "server_error",
        message: "Could not send verification email.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  if (!result.ok) {
    const response: ResendEmailVerificationResponse = {
      error: {
        code: "rate_limited",
        message: "Too many verification emails. Please try again later.",
      },
      ok: false,
    };

    return NextResponse.json(response, {
      headers: getRateLimitHeaders(result.rateLimitStatus),
      status: 429,
    });
  }

  const response: ResendEmailVerificationResponse =
    result.status === "already_verified"
      ? {
          code: "already_verified",
          message: alreadyVerifiedMessage,
          ok: true,
        }
      : {
          code: "sent",
          message: safeSentMessage,
          ok: true,
        };

  return NextResponse.json(response);
}
