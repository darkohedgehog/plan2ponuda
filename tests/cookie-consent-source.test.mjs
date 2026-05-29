import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "hr", "sr", "de", "sl"];
const cookieConsentKeys = [
  "banner.title",
  "banner.description",
  "banner.acceptNecessary",
  "banner.acceptAll",
  "banner.settings",
  "modal.title",
  "modal.description",
  "categories.necessary.title",
  "categories.necessary.description",
  "categories.necessary.alwaysActive",
  "categories.analytics.title",
  "categories.analytics.description",
  "categories.analytics.notUsed",
  "categories.marketing.title",
  "categories.marketing.description",
  "categories.marketing.notUsed",
  "actions.save",
  "actions.rejectOptional",
  "actions.close",
  "messages.saved",
  "footer.cookieSettings",
];

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMessages(locale) {
  return JSON.parse(readSource(`messages/${locale}.json`));
}

function getNestedValue(value, keyPath) {
  return keyPath
    .split(".")
    .reduce((currentValue, key) => currentValue?.[key], value);
}

function flattenKeys(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.keys(value).flatMap((key) =>
    flattenKeys(value[key], prefix ? `${prefix}.${key}` : key),
  );
}

test("cookie consent UI is mounted only in the public marketing layout", () => {
  const marketingLayout = readSource("src/app/[locale]/(marketing)/layout.tsx");
  const dashboardLayout = readSource("src/app/[locale]/dashboard/layout.tsx");

  assert.match(marketingLayout, /CookieConsentProvider/);
  assert.doesNotMatch(dashboardLayout, /CookieConsentProvider/);
});

test("footer includes a Cookie settings trigger without replacing the Cookies page link", () => {
  const footer = readSource("src/components/marketing/public-footer.tsx");

  assert.match(footer, /href: "\/cookies"/);
  assert.match(footer, /CookieSettingsButton/);
  assert.match(footer, /footer\.cookieSettings/);
});

test("cookie consent storage uses a stable first-party cookie without personal data", () => {
  const storage = readSource("src/lib/cookie-consent/storage.ts");

  assert.match(storage, /COOKIE_CONSENT_COOKIE_NAME = "ploro_cookie_consent"/);
  assert.match(storage, /max-age=\$\{COOKIE_CONSENT_MAX_AGE_SECONDS\}/);
  assert.match(storage, /SameSite=Lax/);
  assert.match(storage, /Secure/);
  assert.match(storage, /necessary: true/);
  assert.match(storage, /analytics: false/);
  assert.match(storage, /marketing: false/);
  assert.doesNotMatch(storage, /email|userId|accountId|ipAddress|sessionToken/i);
});

test("cookie consent UI does not load analytics or marketing scripts", () => {
  const source = readSource("src/components/marketing/cookie-consent.tsx");

  assert.match(source, /useTranslations\("CookieConsent"\)/);
  assert.match(source, /AcceptAll/);
  assert.match(source, /necessaryOnlyConsent/);
  assert.doesNotMatch(source, /next\/script|<Script|gtag|googletagmanager|google-analytics|fbq|facebook|pixel/i);
});

test("cookie consent locale keys exist with matching key parity and Serbian remains Latin", () => {
  const referenceKeys = flattenKeys(readMessages("en").CookieConsent).sort();

  assert.deepEqual(referenceKeys, cookieConsentKeys.sort());

  for (const locale of locales) {
    const messages = readMessages(locale);
    const keys = flattenKeys(messages.CookieConsent).sort();

    assert.deepEqual(keys, referenceKeys, `${locale} CookieConsent key mismatch`);

    for (const key of cookieConsentKeys) {
      assert.equal(
        typeof getNestedValue(messages.CookieConsent, key),
        "string",
        `${locale}.${key} should be a string`,
      );
      assert.ok(
        getNestedValue(messages.CookieConsent, key).length > 0,
        `${locale}.${key} should not be empty`,
      );
    }
  }

  assert.doesNotMatch(JSON.stringify(readMessages("sr").CookieConsent), /[\u0400-\u04ff]/);
});

test("Cookies page mentions that preferences can be changed from the footer", () => {
  const cookiesPage = readSource("src/app/[locale]/(marketing)/cookies/page.tsx");

  assert.match(cookiesPage, /"preferences"/);

  for (const locale of locales) {
    const preferences = readMessages(locale).Cookies.sections.preferences;

    assert.equal(typeof preferences.title, "string");
    assert.equal(typeof preferences.body, "string");
    assert.match(preferences.body, /Cookie settings|postavk|podešavanj|Cookie-Einstellungen|nastavitv/i);
  }
});
