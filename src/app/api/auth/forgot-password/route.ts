import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/lib/validations/auth.schema";
import { requestPasswordReset } from "@/server/services/auth-service";
import type { ForgotPasswordResponse } from "@/types/auth";

const safeSuccessMessage =
  "If an account exists for this email, password reset instructions will be sent.";

const invalidInputResponse: ForgotPasswordResponse = {
  error: {
    code: "invalid_input",
    message: "Enter a valid email address.",
  },
  ok: false,
};

function getRateLimitKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function getBaseUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  const body = await request.json().catch((): unknown => null);
  const parsedInput = forgotPasswordSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const result = await requestPasswordReset(
    parsedInput.data,
    getRateLimitKey(request),
    getBaseUrl(request),
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
        message: "Too many reset requests. Try again later.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 429 });
  }

  const response: ForgotPasswordResponse = {
    message: safeSuccessMessage,
    ok: true,
  };

  if (process.env.NODE_ENV !== "production" && result.devResetUrl) {
    return NextResponse.json({
      ...response,
      devResetUrl: result.devResetUrl,
    });
  }

  return NextResponse.json(response);
}
