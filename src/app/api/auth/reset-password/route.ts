import { NextResponse } from "next/server";

import { resetPasswordSchema } from "@/lib/validations/auth.schema";
import { resetPassword } from "@/server/services/auth-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createCompositeRateLimitKey,
  getClientIpAddress,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type { ResetPasswordResponse } from "@/types/auth";

const invalidInputResponse: ResetPasswordResponse = {
  error: {
    code: "invalid_input",
    message: "Enter a valid reset token and password.",
  },
  ok: false,
};

export async function POST(request: Request) {
  const ipAddress = getClientIpAddress(request);

  try {
    await checkRateLimitOrThrow({
      key: createCompositeRateLimitKey([
        {
          kind: "ip",
          value: ipAddress,
        },
      ]),
      scope: RATE_LIMIT_SCOPES.resetPassword,
      ...RATE_LIMIT_POLICIES.resetPassword,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: ResetPasswordResponse = {
        error: {
          code: "rate_limited",
          message: "Too many attempts. Please try again later.",
        },
        ok: false,
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    console.error("Password reset rate limit failed", error);

    const response: ResetPasswordResponse = {
      error: {
        code: "server_error",
        message: "Unable to reset password.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = resetPasswordSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const result = await resetPassword(parsedInput.data).catch((error: unknown) => {
    console.error("Password reset failed", error);

    return null;
  });

  if (!result) {
    const response: ResetPasswordResponse = {
      error: {
        code: "server_error",
        message: "Unable to reset password.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  if (!result.ok) {
    const response: ResetPasswordResponse = {
      error: {
        code: "invalid_or_expired_token",
        message: "This password reset link is invalid or expired.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  const response: ResetPasswordResponse = {
    message: "Password reset. You can now sign in with your new password.",
    ok: true,
  };

  return NextResponse.json(response);
}
