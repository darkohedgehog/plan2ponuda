import "server-only";

const AUTH_EMAIL_ORIGIN_ENV_NAMES = [
  "APP_ORIGIN",
  "AUTH_EMAIL_ORIGIN",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
] as const;
const AUTH_EMAIL_ALLOWED_ORIGINS_ENV = "AUTH_EMAIL_ALLOWED_ORIGINS";
const LOCAL_DEVELOPMENT_HOSTNAMES = new Set([
  "127.0.0.1",
  "::1",
  "[::1]",
  "localhost",
]);

export type AuthEmailOriginOptions = {
  env?: NodeJS.ProcessEnv;
  request?: Request;
};

export function getAuthEmailOrigin(
  options: AuthEmailOriginOptions = {},
): string | null {
  const env = options.env ?? process.env;
  const configuredOrigin = getConfiguredAuthEmailOrigin(env);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (isLocalDevelopment(env) && options.request) {
    return getLocalDevelopmentRequestOrigin(options.request);
  }

  return null;
}

export function isLocalDevelopment(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "development";
}

function getConfiguredAuthEmailOrigin(env: NodeJS.ProcessEnv): string | null {
  for (const name of AUTH_EMAIL_ORIGIN_ENV_NAMES) {
    const origin = normalizeConfiguredOrigin(env[name], env);

    if (origin) {
      return origin;
    }
  }

  return null;
}

function normalizeConfiguredOrigin(
  value: string | undefined,
  env: NodeJS.ProcessEnv,
): string | null {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);

    if (!isLocalDevelopment(env) && url.protocol !== "https:") {
      return null;
    }

    if (!isAllowedAuthEmailOrigin(url, env)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function getLocalDevelopmentRequestOrigin(request: Request): string | null {
  try {
    const url = new URL(request.url);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    if (!LOCAL_DEVELOPMENT_HOSTNAMES.has(url.hostname)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isAllowedAuthEmailOrigin(
  url: URL,
  env: NodeJS.ProcessEnv,
): boolean {
  const allowedHostnames = getAllowedHostnames(env);
  const allowedOrigins = getAllowedOrigins(env);

  if (allowedHostnames.size === 0 && allowedOrigins.size === 0) {
    return true;
  }

  return (
    allowedHostnames.has(url.hostname.toLowerCase()) ||
    allowedOrigins.has(url.origin.toLowerCase())
  );
}

function getAllowedOrigins(env: NodeJS.ProcessEnv): Set<string> {
  return new Set(
    getEnvList(env[AUTH_EMAIL_ALLOWED_ORIGINS_ENV])
      .map((value) => normalizeAllowedOrigin(value))
      .filter((value): value is string => Boolean(value)),
  );
}

function getAllowedHostnames(env: NodeJS.ProcessEnv): Set<string> {
  return new Set(
    getEnvList(env[AUTH_EMAIL_ALLOWED_ORIGINS_ENV])
      .map((value) => normalizeAllowedHostname(value))
      .filter((value): value is string => Boolean(value)),
  );
}

function normalizeAllowedOrigin(value: string): string | null {
  try {
    const url = new URL(value);

    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeAllowedHostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

function getEnvList(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean) ?? []
  );
}
