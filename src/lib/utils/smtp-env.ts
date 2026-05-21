export type SmtpServerEnv = {
  fromEmail: string;
  fromName: string;
  host: string;
  password: string;
  port: number;
  secure: boolean;
  user: string;
};

type EnvRecord = Record<string, string | undefined>;

const SMTP_ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM_EMAIL",
  "SMTP_FROM_NAME",
] as const;

export function hasCompleteSmtpServerEnv(env: EnvRecord): boolean {
  return SMTP_ENV_KEYS.every((key) => Boolean(env[key]?.trim()));
}

export function parseSmtpServerEnv(env: EnvRecord): SmtpServerEnv {
  return {
    fromEmail: requiredSmtpEnv(env, "SMTP_FROM_EMAIL"),
    fromName: requiredSmtpEnv(env, "SMTP_FROM_NAME"),
    host: requiredSmtpEnv(env, "SMTP_HOST"),
    password: requiredSmtpEnv(env, "SMTP_PASSWORD"),
    port: parseSmtpPort(requiredSmtpEnv(env, "SMTP_PORT")),
    secure: parseSmtpSecure(requiredSmtpEnv(env, "SMTP_SECURE")),
    user: requiredSmtpEnv(env, "SMTP_USER"),
  };
}

function requiredSmtpEnv(env: EnvRecord, key: (typeof SMTP_ENV_KEYS)[number]) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function parseSmtpPort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("Invalid SMTP_PORT environment variable.");
  }

  return port;
}

function parseSmtpSecure(value: string): boolean {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  throw new Error("Invalid SMTP_SECURE environment variable.");
}
