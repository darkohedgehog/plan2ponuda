import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("sign-up flow sends the current locale into localized verification links", () => {
  const signUpForm = readSource("src/components/auth/sign-up-form.tsx");
  const signUpRoute = readSource("src/app/api/auth/sign-up/route.ts");
  const authService = readSource("src/server/services/auth-service.ts");

  assert.match(signUpForm, /useLocale/);
  assert.match(signUpForm, /locale,/);
  assert.match(signUpRoute, /getStringProperty\(body, "locale"\)/);
  assert.match(
    signUpRoute,
    /createUserWithPassword\(\s*input,\s*getBaseUrl\(request\),\s*locale,\s*\)/s,
  );
  assert.match(
    authService,
    /buildEmailVerificationUrl\(\s*params\.baseUrl,\s*rawToken,\s*params\.locale,\s*\)/s,
  );
});

test("resend verification flow passes locale without exposing verification tokens in the API route", () => {
  const resendButton = readSource(
    "src/components/auth/resend-verification-email-button.tsx",
  );
  const resendRoute = readSource(
    "src/app/api/auth/resend-verification/route.ts",
  );
  const authService = readSource("src/server/services/auth-service.ts");

  assert.match(resendButton, /useLocale/);
  assert.match(resendButton, /JSON\.stringify\(\{\s*locale,\s*\}\)/);
  assert.match(resendRoute, /getStringProperty\(body, "locale"\)/);
  assert.match(resendRoute, /locale,/);
  assert.match(authService, /locale:\s*params\.locale/);
  assert.doesNotMatch(
    resendRoute,
    /devVerificationUrl|verificationUrl|rawToken|tokenHash/,
  );
});

test("forgot-password flow sends the current locale into localized reset links", () => {
  const forgotPasswordForm = readSource(
    "src/components/auth/forgot-password-form.tsx",
  );
  const forgotPasswordRoute = readSource(
    "src/app/api/auth/forgot-password/route.ts",
  );
  const authService = readSource("src/server/services/auth-service.ts");

  assert.match(forgotPasswordForm, /useLocale/);
  assert.match(forgotPasswordForm, /locale,/);
  assert.match(forgotPasswordRoute, /getStringProperty\(body, "locale"\)/);
  assert.match(
    forgotPasswordRoute,
    /requestPasswordReset\(\s*parsedInput\.data,\s*ipAddress,\s*getBaseUrl\(request\),\s*locale,\s*\)/s,
  );
  assert.match(authService, /buildResetUrl\(baseUrl, rawToken, locale\)/);
});

test("verification and reset tokens are not written to logs", () => {
  const authService = readSource("src/server/services/auth-service.ts");

  assert.doesNotMatch(authService, /Development email verification URL/);
  assert.doesNotMatch(authService, /Development password reset URL/);
});

test("proxy redirects old non-localized auth links before i18n routing", () => {
  const proxy = readSource("proxy.ts");

  assert.match(proxy, /getLegacyAuthRedirectUrl/);
  assert.match(proxy, /legacyAuthRedirectUrl/);
  assert.match(proxy, /NextResponse\.redirect\(legacyAuthRedirectUrl\)/);
  assert.ok(
    proxy.indexOf("getLegacyAuthRedirectUrl") <
      proxy.indexOf("handleI18nRouting(request)"),
  );
});
