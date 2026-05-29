export const COOKIE_CONSENT_COOKIE_NAME = "ploro_cookie_consent";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const necessaryOnlyConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
} satisfies Omit<CookieConsentPreferences, "updatedAt">;

export const AcceptAll = {
  necessary: true,
  analytics: true,
  marketing: true,
} satisfies Omit<CookieConsentPreferences, "updatedAt">;

export function createCookieConsentPreferences(
  preferences: Omit<CookieConsentPreferences, "updatedAt">,
): CookieConsentPreferences {
  return {
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    updatedAt: new Date().toISOString(),
  };
}

export function parseCookieConsent(
  value: string | undefined,
): CookieConsentPreferences | null {
  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(decodeURIComponent(value)) as Partial<
      CookieConsentPreferences
    >;

    if (
      parsedValue.necessary !== true ||
      typeof parsedValue.analytics !== "boolean" ||
      typeof parsedValue.marketing !== "boolean" ||
      typeof parsedValue.updatedAt !== "string"
    ) {
      return null;
    }

    return {
      necessary: true,
      analytics: parsedValue.analytics,
      marketing: parsedValue.marketing,
      updatedAt: parsedValue.updatedAt,
    };
  } catch {
    return null;
  }
}

export function getCookieConsentFromDocument(): CookieConsentPreferences | null {
  const cookieValue = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`))
    ?.split("=")[1];

  return parseCookieConsent(cookieValue);
}

export function writeCookieConsentToDocument(
  preferences: CookieConsentPreferences,
) {
  const secureAttribute =
    window.location.protocol === "https:" ? "; Secure" : "";
  const encodedPreferences = encodeURIComponent(JSON.stringify(preferences));

  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodedPreferences}; max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; path=/; SameSite=Lax${secureAttribute}`;
}
