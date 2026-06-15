import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("auth forms send Cloudflare Turnstile tokens", () => {
  const signInForm = readSource("src/components/auth/sign-in-form.tsx");
  const signUpForm = readSource("src/components/auth/sign-up-form.tsx");
  const forgotPasswordForm = readSource(
    "src/components/auth/forgot-password-form.tsx",
  );

  for (const source of [signInForm, signUpForm, forgotPasswordForm]) {
    assert.match(source, /TurnstileWidget/);
    assert.match(source, /turnstileToken/);
    assert.match(source, /resetTurnstile/);
  }
});

test("auth endpoints validate Turnstile tokens server-side", () => {
  const nextAuthRoute = readSource("src/app/api/auth/[...nextauth]/route.ts");
  const signUpRoute = readSource("src/app/api/auth/sign-up/route.ts");
  const forgotPasswordRoute = readSource(
    "src/app/api/auth/forgot-password/route.ts",
  );
  const turnstileService = readSource("src/server/services/turnstile-service.ts");

  for (const source of [nextAuthRoute, signUpRoute, forgotPasswordRoute]) {
    assert.match(source, /verifyTurnstileToken/);
    assert.match(source, /turnstileToken/);
  }

  assert.match(turnstileService, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
  assert.match(turnstileService, /TURNSTILE_SECRET_KEY/);
  assert.doesNotMatch(turnstileService, /NEXT_PUBLIC_TURNSTILE.*SECRET/);
});

test("Turnstile can be disabled for local development", () => {
  const signInPage = readSource("src/app/[locale]/(auth)/sign-in/page.tsx");
  const signUpPage = readSource("src/app/[locale]/(auth)/sign-up/page.tsx");
  const forgotPasswordPage = readSource(
    "src/app/[locale]/(auth)/forgot-password/page.tsx",
  );
  const signInForm = readSource("src/components/auth/sign-in-form.tsx");
  const signUpForm = readSource("src/components/auth/sign-up-form.tsx");
  const forgotPasswordForm = readSource(
    "src/components/auth/forgot-password-form.tsx",
  );
  const turnstileWidget = readSource("src/components/auth/turnstile-widget.tsx");
  const turnstileService = readSource("src/server/services/turnstile-service.ts");

  for (const source of [signInPage, signUpPage, forgotPasswordPage]) {
    assert.match(source, /isTurnstileEnabled/);
    assert.match(source, /turnstileEnabled=\{isTurnstileEnabled\(\)\}/);
  }

  for (const source of [signInForm, signUpForm, forgotPasswordForm]) {
    assert.match(source, /turnstileEnabled/);
  }

  assert.match(turnstileWidget, /enabled/);
  assert.match(turnstileService, /TURNSTILE_ENABLED/);
  assert.match(turnstileService, /isTurnstileEnabled/);
});

test("Turnstile disabled mode omits client tokens and server network calls", () => {
  const signInForm = readSource("src/components/auth/sign-in-form.tsx");
  const signUpForm = readSource("src/components/auth/sign-up-form.tsx");
  const forgotPasswordForm = readSource(
    "src/components/auth/forgot-password-form.tsx",
  );
  const turnstileService = readSource("src/server/services/turnstile-service.ts");

  for (const source of [signInForm, signUpForm, forgotPasswordForm]) {
    assert.match(source, /\.\.\.\(turnstileEnabled \? \{ turnstileToken \} : \{\}\)/);
  }

  const disabledCheckIndex = turnstileService.indexOf(
    "if (!isTurnstileEnabled())",
  );
  const fetchIndex = turnstileService.indexOf("fetch(TURNSTILE_SITEVERIFY_URL");

  assert.ok(disabledCheckIndex > -1);
  assert.ok(fetchIndex > -1);
  assert.ok(disabledCheckIndex < fetchIndex);
});

test("Turnstile enabled mode rejects missing tokens safely", () => {
  const turnstileService = readSource("src/server/services/turnstile-service.ts");
  const nextAuthRoute = readSource("src/app/api/auth/[...nextauth]/route.ts");
  const signUpRoute = readSource("src/app/api/auth/sign-up/route.ts");
  const forgotPasswordRoute = readSource(
    "src/app/api/auth/forgot-password/route.ts",
  );

  assert.match(turnstileService, /TURNSTILE_SECRET_KEY/);
  assert.match(turnstileService, /reason: "missing_secret"/);
  assert.match(turnstileService, /!token \|\|/);
  assert.match(turnstileService, /reason: "invalid_token"/);

  for (const source of [nextAuthRoute, signUpRoute, forgotPasswordRoute]) {
    assert.match(source, /if \(!turnstile\.ok\)/);
    assert.match(source, /status: 403/);
  }
});

test("auth redirects and email origins are constrained safely", () => {
  const signInForm = readSource("src/components/auth/sign-in-form.tsx");
  const signUpRoute = readSource("src/app/api/auth/sign-up/route.ts");
  const forgotPasswordRoute = readSource(
    "src/app/api/auth/forgot-password/route.ts",
  );
  const authEmailOrigin = readSource("src/lib/auth/auth-email-origin.ts");

  assert.match(signInForm, /getSafeCallbackUrl\(result\.url, callbackUrl\)/);
  assert.doesNotMatch(signInForm, /router\.push\(result\.url \?\? callbackUrl\)/);
  assert.match(signInForm, /value\.startsWith\("\/\/"\)/);
  assert.match(signInForm, /new URL\(value, "http:\/\/localhost"\)/);

  for (const source of [signUpRoute, forgotPasswordRoute]) {
    assert.match(source, /getAuthEmailOrigin\(\{\s*request\s*\}\)/);
    assert.doesNotMatch(source, /return new URL\(request\.url\)\.origin/);
  }

  assert.match(authEmailOrigin, /APP_ORIGIN/);
  assert.match(authEmailOrigin, /AUTH_EMAIL_ALLOWED_ORIGINS/);
  assert.match(authEmailOrigin, /NODE_ENV === "development"/);
  assert.match(authEmailOrigin, /url\.protocol !== "https:"/);
});

test("email verification schema and verification mail flow exist", () => {
  const prismaSchema = readSource("prisma/schema.prisma");
  const authService = readSource("src/server/services/auth-service.ts");
  const mailService = readSource("src/server/services/mail-service.ts");
  const mailMessage = readSource("src/server/services/mail-message.ts");

  assert.match(prismaSchema, /emailVerifiedAt\s+DateTime\?/);
  assert.match(prismaSchema, /model EmailVerificationToken \{/);
  assert.match(authService, /createEmailVerificationToken/);
  assert.match(authService, /verifyEmailToken/);
  assert.match(mailService, /sendEmailVerificationEmail/);
  assert.match(mailMessage, /buildEmailVerificationEmailMessage/);
});

test("AI, upload, quote, export, and document review mutations require verified email", () => {
  const protectedRoutes = [
    "src/app/api/analysis/[projectId]/route.ts",
    "src/app/api/projects/[projectId]/upload/route.ts",
    "src/app/api/projects/[projectId]/documents/upload/route.ts",
    "src/app/api/projects/[projectId]/documents/[documentId]/analyze/route.ts",
    "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/candidates/route.ts",
    "src/app/api/projects/[projectId]/documents/[documentId]/analysis/[analysisId]/import/route.ts",
    "src/app/api/quotes/[projectId]/route.ts",
    "src/app/api/pdf/[projectId]/route.ts",
    "src/app/api/excel/[projectId]/route.ts",
  ];

  for (const file of protectedRoutes) {
    const source = readSource(file);

    assert.match(source, /requireApiVerifiedUser/);
    assert.doesNotMatch(source, /requireApiUser\(\)/);
  }
});
