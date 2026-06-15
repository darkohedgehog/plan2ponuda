import "server-only";

import { randomUUID } from "node:crypto";

const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TOKEN_MAX_LENGTH = 2048;
const TURNSTILE_ALLOWED_HOSTNAMES_ENV = "TURNSTILE_ALLOWED_HOSTNAMES";

export type TurnstileAction = "forgot-password" | "sign-in" | "sign-up";

type TurnstileSiteverifyResponse = {
  action?: string;
  "error-codes"?: string[];
  hostname?: string;
  success: boolean;
};

export type VerifyTurnstileTokenParams = {
  action: TurnstileAction;
  remoteIp: string;
  token: string | null;
};

export type VerifyTurnstileTokenResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason:
        | "hostname_mismatch"
        | "invalid_token"
        | "missing_secret"
        | "service_error"
        | "unexpected_action";
    };

export function isTurnstileEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!isLocalDevelopment(env)) {
    return true;
  }

  return env.TURNSTILE_ENABLED?.trim().toLowerCase() === "true";
}

export function isLocalDevelopment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV === "development";
}

export async function verifyTurnstileToken({
  action,
  remoteIp,
  token,
}: VerifyTurnstileTokenParams): Promise<VerifyTurnstileTokenResult> {
  if (!isTurnstileEnabled()) {
    return {
      ok: true,
    };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return {
      ok: false,
      reason: "missing_secret",
    };
  }

  if (
    !token ||
    token.trim().length === 0 ||
    token.length > TURNSTILE_TOKEN_MAX_LENGTH
  ) {
    return {
      ok: false,
      reason: "invalid_token",
    };
  }

  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        remoteip: remoteIp,
        response: token,
        secret,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "service_error",
      };
    }

    const result = (await response.json()) as TurnstileSiteverifyResponse;

    if (!result.success) {
      return {
        ok: false,
        reason: "invalid_token",
      };
    }

    if (result.action && result.action !== action) {
      return {
        ok: false,
        reason: "unexpected_action",
      };
    }

    if (!isAllowedHostname(result.hostname)) {
      return {
        ok: false,
        reason: "hostname_mismatch",
      };
    }

    return {
      ok: true,
    };
  } catch {
    return {
      ok: false,
      reason: "service_error",
    };
  }
}

function isAllowedHostname(hostname: string | undefined): boolean {
  const allowedHostnames = getAllowedHostnames();

  if (allowedHostnames.size === 0) {
    return isLocalDevelopment();
  }

  if (!hostname) {
    return false;
  }

  return allowedHostnames.has(hostname.toLowerCase());
}

function getAllowedHostnames(): Set<string> {
  return new Set(
    process.env[TURNSTILE_ALLOWED_HOSTNAMES_ENV]
      ?.split(",")
      .map((hostname) => normalizeAllowedHostname(hostname.trim()))
      .filter(Boolean) ?? [],
  );
}

function normalizeAllowedHostname(hostname: string): string {
  try {
    return new URL(hostname).hostname.toLowerCase();
  } catch {
    return hostname.toLowerCase();
  }
}
