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
  type RateLimitExceededStatus,
  type RateLimitScope,
  type RateLimitStatus,
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
      const rateLimit = await checkSignInRateLimit({
        email: email ?? "unknown",
        ipAddress,
      });

      if (rateLimit) {
        return NextResponse.json(
          {
            error: "Too many attempts. Please wait and try again.",
          },
          {
            headers: getRateLimitHeaders(rateLimit),
            status: 429,
          },
        );
      }
    } catch (error: unknown) {
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

async function checkSignInRateLimit(params: {
  email: string;
  ipAddress: string;
}): Promise<RateLimitExceededStatus | null> {
  const emailIpRateLimitKey = createCompositeRateLimitKey([
    {
      kind: "email",
      value: params.email,
    },
    {
      kind: "ip",
      value: params.ipAddress,
    },
  ]);
  const emailRateLimitKey = createCompositeRateLimitKey([
    {
      kind: "email",
      value: params.email,
    },
  ]);
  const ipRateLimitKey = createCompositeRateLimitKey([
    {
      kind: "ip",
      value: params.ipAddress,
    },
  ]);
  const rateLimits = [
    await checkCredentialRateLimit({
      key: emailIpRateLimitKey,
      policy: RATE_LIMIT_POLICIES.signInEmailIp,
      scope: RATE_LIMIT_SCOPES.signInEmailIp,
    }),
    await checkCredentialRateLimit({
      key: emailRateLimitKey,
      policy: RATE_LIMIT_POLICIES.signInEmail,
      scope: RATE_LIMIT_SCOPES.signInEmail,
    }),
    await checkCredentialRateLimit({
      key: ipRateLimitKey,
      policy: RATE_LIMIT_POLICIES.signInIp,
      scope: RATE_LIMIT_SCOPES.signInIp,
    }),
  ];

  return getExceededRateLimitStatus(rateLimits);
}

async function checkCredentialRateLimit(params: {
  key: string;
  policy: {
    limit: number;
    windowSeconds: number;
  };
  scope: RateLimitScope;
}): Promise<RateLimitStatus> {
  return checkRateLimitOrThrow({
    key: params.key,
    scope: params.scope,
    ...params.policy,
  }).catch((error: unknown) => {
    if (error instanceof RateLimitExceededError) {
      return error.status;
    }

    throw error;
  });
}

function getExceededRateLimitStatus(
  statuses: RateLimitStatus[],
): RateLimitExceededStatus | null {
  const exceededStatuses = statuses.filter(
    (status): status is RateLimitExceededStatus => !status.ok,
  );

  if (exceededStatuses.length === 0) {
    return null;
  }

  return exceededStatuses.reduce((selectedStatus, status) =>
    status.retryAfterSeconds > selectedStatus.retryAfterSeconds
      ? status
      : selectedStatus,
  );
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
