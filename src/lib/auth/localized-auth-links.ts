import { defaultLocale, resolveLocale, type Locale } from "../../i18n/routing";

const LEGACY_AUTH_REDIRECT_PATHS = new Set(["/verify-email", "/reset-password"]);

export function getAuthLinkLocale(locale?: string | null): Locale {
  return resolveLocale(locale ?? undefined);
}

export function buildEmailVerificationUrl(
  baseUrl: string,
  token: string,
  locale?: string | null,
): string {
  const resolvedLocale = getAuthLinkLocale(locale);
  const verificationUrl = new URL(`/${resolvedLocale}/verify-email`, baseUrl);
  verificationUrl.searchParams.set("token", token);

  return verificationUrl.toString();
}

export function buildResetUrl(
  baseUrl: string,
  token: string,
  locale?: string | null,
): string {
  const resolvedLocale = getAuthLinkLocale(locale);
  const resetUrl = new URL(`/${resolvedLocale}/reset-password`, baseUrl);
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export function getLegacyAuthRedirectUrl(requestUrl: string): string | null {
  const url = new URL(requestUrl);

  if (!LEGACY_AUTH_REDIRECT_PATHS.has(url.pathname)) {
    return null;
  }

  url.pathname = `/${defaultLocale}${url.pathname}`;

  return url.toString();
}
