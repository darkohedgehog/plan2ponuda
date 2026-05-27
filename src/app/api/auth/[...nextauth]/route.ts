import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/email";
import { authOptions } from "@/lib/auth/auth";
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

const handler = NextAuth(authOptions);

type AuthRouteContext = {
  params: Promise<{
    nextauth: string[];
  }>;
};

export { handler as GET };

export async function POST(request: Request, context: AuthRouteContext) {
  if (isCredentialsCallback(request)) {
    const email = await getCredentialsEmail(request);
    const ipAddress = getClientIpAddress(request);

    try {
      await checkRateLimitOrThrow({
        key: createCompositeRateLimitKey([
          {
            kind: "email",
            value: email ?? "unknown",
          },
          {
            kind: "ip",
            value: ipAddress,
          },
        ]),
        scope: RATE_LIMIT_SCOPES.signIn,
        ...RATE_LIMIT_POLICIES.signIn,
      });
    } catch (error: unknown) {
      if (error instanceof RateLimitExceededError) {
        return NextResponse.json(
          {
            error: "Too many attempts. Please wait and try again.",
          },
          {
            headers: getRateLimitHeaders(error.status),
            status: 429,
          },
        );
      }

      console.error("Sign-in rate limit failed", error);

      return NextResponse.json(
        {
          error: "Unable to sign in.",
        },
        {
          status: 500,
        },
      );
    }

    const turnstileToken = await getCredentialsTurnstileToken(request);
    const turnstile = await verifyTurnstileToken({
      action: "sign-in",
      remoteIp: ipAddress,
      token: turnstileToken,
    });

    if (!turnstile.ok) {
      return NextResponse.json(
        {
          error: "Security verification failed. Please try again.",
        },
        {
          status: 403,
        },
      );
    }
  }

  return handler(request, context);
}

function isCredentialsCallback(request: Request): boolean {
  return new URL(request.url).pathname.endsWith(
    "/api/auth/callback/credentials",
  );
}

async function getCredentialsTurnstileToken(
  request: Request,
): Promise<string | null> {
  const formData = await request
    .clone()
    .formData()
    .catch((): FormData | null => null);
  const formToken = formData?.get("turnstileToken");

  if (typeof formToken === "string") {
    return formToken;
  }

  const body = await request
    .clone()
    .json()
    .catch((): unknown => null);

  return getStringProperty(body, "turnstileToken");
}

async function getCredentialsEmail(request: Request): Promise<string | null> {
  const formData = await request
    .clone()
    .formData()
    .catch((): FormData | null => null);
  const formEmail = formData?.get("email");

  if (typeof formEmail === "string") {
    return normalizeEmail(formEmail);
  }

  const body = await request
    .clone()
    .json()
    .catch((): unknown => null);
  const bodyEmail = getStringProperty(body, "email");

  return bodyEmail ? normalizeEmail(bodyEmail) : null;
}

function getStringProperty(input: unknown, property: string): string | null {
  if (!input || typeof input !== "object" || !(property in input)) {
    return null;
  }

  const value = (input as Record<string, unknown>)[property];

  return typeof value === "string" ? value : null;
}
