import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readJson(path) {
  return JSON.parse(readSource(path));
}

test("authenticated resend verification API route is safe and thin", () => {
  const routePath = "src/app/api/auth/resend-verification/route.ts";

  assert.ok(existsSync(new URL(`../${routePath}`, import.meta.url)));

  const source = readSource(routePath);

  assert.match(source, /requireApiUser/);
  assert.match(source, /resendVerificationEmailForUser/);
  assert.match(source, /ResendEmailVerificationResponse/);
  assert.match(source, /already_verified/);
  assert.match(source, /Your email is already verified\./);
  assert.match(source, /If verification is needed, a new email has been sent\./);
  assert.match(source, /Too many verification emails\. Please try again later\./);
  assert.match(source, /if \(!auth\.ok\)/);
  assert.match(source, /return auth\.response/);
  assert.match(source, /status:\s*429/);
  assert.doesNotMatch(source, /devVerificationUrl|verificationUrl|rawToken|tokenHash/);
});

test("resend verification service reuses verification token flow and rate limits unverified users", () => {
  const authService = readSource("src/server/services/auth-service.ts");
  const rateLimitService = readSource("src/server/services/rate-limit-service.ts");

  assert.match(rateLimitService, /resendEmailVerification:\s*"resend_email_verification"/);
  assert.match(
    rateLimitService,
    /resendEmailVerification:\s*\{\s*limit:\s*3,\s*windowSeconds:\s*15 \* 60/s,
  );

  assert.match(authService, /resendVerificationEmailForUser/);
  assert.match(authService, /emailVerifiedAt:\s*true/);
  assert.match(authService, /RATE_LIMIT_SCOPES\.resendEmailVerification/);
  assert.match(authService, /RATE_LIMIT_POLICIES\.resendEmailVerification/);
  assert.match(authService, /createUserRateLimitKey\(\{\s*userId/s);
  assert.match(authService, /prepareEmailVerification\(\{/);
  assert.match(authService, /exposeDevVerificationUrl:\s*false/);
  assert.match(authService, /locale:\s*params\.locale/);
  assert.doesNotMatch(authService, /logDevVerificationUrl/);
  assert.doesNotMatch(authService, /Development email verification URL/);

  const verifiedCheckIndex = authService.indexOf("emailVerifiedAt");
  const rateLimitIndex = authService.indexOf("RATE_LIMIT_SCOPES.resendEmailVerification");

  assert.ok(verifiedCheckIndex > -1);
  assert.ok(rateLimitIndex > -1);
  assert.ok(verifiedCheckIndex < rateLimitIndex);
});

test("project document blocked state exposes resend verification action", () => {
  const uploadForm = readSource(
    "src/components/projects/project-document-upload-form.tsx",
  );
  const resendButton = readSource(
    "src/components/auth/resend-verification-email-button.tsx",
  );

  assert.match(uploadForm, /ResendVerificationEmailButton/);
  assert.match(uploadForm, /state\.errorKey === "errors\.emailNotVerified"/);
  assert.match(resendButton, /\/api\/auth\/resend-verification/);
  assert.match(resendButton, /EmailVerification/);
  assert.match(resendButton, /isSending/);
  assert.match(resendButton, /already_verified/);
  assert.match(resendButton, /rate_limited/);
});

test("resend verification messages exist in every locale", () => {
  const locales = ["en", "hr", "sr", "de", "sl"];
  const expectedKeys = [
    "alreadyVerified",
    "couldNotSend",
    "featureRequired",
    "resend",
    "sending",
    "sent",
    "tooMany",
  ];

  for (const locale of locales) {
    const messages = readJson(`messages/${locale}.json`);

    assert.deepEqual(Object.keys(messages.EmailVerification).sort(), expectedKeys);
  }
});
