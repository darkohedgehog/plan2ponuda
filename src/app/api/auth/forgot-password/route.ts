import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/lib/validations/auth.schema";
import { requestPasswordReset } from "@/server/services/auth-service";
import {
  getClientIpAddress,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import { verifyTurnstileToken } from "@/server/services/turnstile-service";
import type { ForgotPasswordResponse } from "@/types/auth";

const safeSuccessMessage =
  "If the account exists, password reset instructions have been sent.";

const invalidInputResponse: ForgotPasswordResponse = {
  error: {
    code: "invalid_input",
    message: "Enter a valid email address.",
  },
  ok: false,
};

const turnstileFailedResponse: ForgotPasswordResponse = {
  error: {
    code: "turnstile_failed",
    message: "Security verification failed. Please try again.",
  },
  ok: false,
};

function getBaseUrl(request: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      console.error("Ignoring invalid NEXT_PUBLIC_APP_URL for password reset.");
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
  const body = await request.json().catch((): unknown => null);
  const parsedInput = forgotPasswordSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const ipAddress = getClientIpAddress(request);
  const turnstile = await verifyTurnstileToken({
    action: "forgot-password",
    remoteIp: ipAddress,
    token: getStringProperty(body, "turnstileToken"),
  });

  if (!turnstile.ok) {
    return NextResponse.json(turnstileFailedResponse, { status: 403 });
  }

  const locale = getStringProperty(body, "locale");
  const result = await requestPasswordReset(
    parsedInput.data,
    ipAddress,
    getBaseUrl(request),
    locale,
  ).catch((error: unknown) => {
    console.error("Password reset request failed", error);

    return null;
  });

  if (!result) {
    const response: ForgotPasswordResponse = {
      error: {
        code: "server_error",
        message: "Unable to process password reset request.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  if (!result.ok) {
    const response: ForgotPasswordResponse = {
      error: {
        code: "rate_limited",
        message: "Too many attempts. Please try again later.",
      },
      ok: false,
    };

    return NextResponse.json(response, {
      headers: getRateLimitHeaders(result.rateLimitStatus),
      status: 429,
    });
  }

  const response: ForgotPasswordResponse = {
    message: safeSuccessMessage,
    ok: true,
  };

  if (process.env.NODE_ENV === "development" && result.devResetUrl) {
    return NextResponse.json({
      ...response,
      devResetUrl: result.devResetUrl,
    });
  }

  return NextResponse.json(response);
}
