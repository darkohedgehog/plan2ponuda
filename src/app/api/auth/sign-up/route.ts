import { NextResponse } from "next/server";
import { z } from "zod";

import { signUpSchema } from "@/lib/validations/auth.schema";
import { createUserWithPassword } from "@/server/services/auth-service";
import { verifyTurnstileToken } from "@/server/services/turnstile-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createCompositeRateLimitKey,
  getClientIpAddress,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type { SignUpResponse } from "@/types/auth";

const invalidInputResponse: SignUpResponse = {
  ok: false,
  error: {
    code: "invalid_input",
    message: "Enter a valid email and a password with at least 8 characters.",
  },
};

const turnstileFailedResponse: SignUpResponse = {
  ok: false,
  error: {
    code: "turnstile_failed",
    message: "Security verification failed. Please try again.",
  },
};

function getBaseUrl(request: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      console.error("Ignoring invalid NEXT_PUBLIC_APP_URL for sign-up.");
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
  try {
    const ipAddress = getClientIpAddress(request);

    await checkRateLimitOrThrow({
      key: createCompositeRateLimitKey([
        {
          kind: "ip",
          value: ipAddress,
        },
      ]),
      scope: RATE_LIMIT_SCOPES.signUp,
      ...RATE_LIMIT_POLICIES.signUp,
    });

    const body = await request.json().catch((): unknown => null);
    const input = signUpSchema.parse(body);
    const locale = getStringProperty(body, "locale");
    const turnstileToken = getStringProperty(body, "turnstileToken");
    const turnstile = await verifyTurnstileToken({
      action: "sign-up",
      remoteIp: ipAddress,
      token: turnstileToken,
    });

    if (!turnstile.ok) {
      return NextResponse.json(turnstileFailedResponse, { status: 403 });
    }

    const result = await createUserWithPassword(
      input,
      getBaseUrl(request),
      locale,
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(invalidInputResponse, { status: 400 });
    }

    if (error instanceof RateLimitExceededError) {
      const response: SignUpResponse = {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many attempts. Please wait and try again.",
        },
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    const response: SignUpResponse = {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to create account.",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
