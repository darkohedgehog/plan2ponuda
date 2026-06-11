import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("forgot-password route returns rate-limit headers on 429", () => {
  const route = readSource("src/app/api/auth/forgot-password/route.ts");

  assert.match(route, /getRateLimitHeaders/);
  assert.match(route, /headers:\s*getRateLimitHeaders\(result\.rateLimitStatus\)/);
  assert.match(route, /status:\s*429/);
});

test("forgot-password rate limit blocks before user lookup and email delivery", () => {
  const service = readSource("src/server/services/auth-service.ts");
  const requestPasswordReset = service.slice(
    service.indexOf("export async function requestPasswordReset"),
  );
  const rateLimitIndex = requestPasswordReset.indexOf(
    "checkPasswordResetRateLimit({",
  );
  const blockedIndex = requestPasswordReset.indexOf("if (rateLimit)");
  const userLookupIndex = requestPasswordReset.indexOf("prisma.user.findUnique({");
  const sendEmailIndex = requestPasswordReset.indexOf("sendPasswordResetEmail({");

  assert.ok(rateLimitIndex > -1);
  assert.ok(blockedIndex > rateLimitIndex);
  assert.ok(userLookupIndex > blockedIndex);
  assert.ok(sendEmailIndex > userLookupIndex);
  assert.match(service, /rateLimitStatus:\s*RateLimitExceededStatus/);
});

test("forgot-password defines layered DB-backed rate limit policies", () => {
  const rateLimitService = readSource("src/server/services/rate-limit-service.ts");

  assert.match(rateLimitService, /forgotPassword:\s*"forgot_password"/);
  assert.match(rateLimitService, /forgotPasswordEmail:\s*"forgot_password_email"/);
  assert.match(rateLimitService, /forgotPasswordIp:\s*"forgot_password_ip"/);
  assert.match(
    rateLimitService,
    /forgotPassword:\s*\{\s*limit:\s*3,\s*windowSeconds:\s*15 \* 60,\s*\}/s,
  );
  assert.match(
    rateLimitService,
    /forgotPasswordEmail:\s*\{\s*limit:\s*5,\s*windowSeconds:\s*60 \* 60,\s*\}/s,
  );
  assert.match(
    rateLimitService,
    /forgotPasswordIp:\s*\{\s*limit:\s*10,\s*windowSeconds:\s*15 \* 60,\s*\}/s,
  );
});

test("forgot-password checks pair, email-only, and IP-only limits before side effects", () => {
  const service = readSource("src/server/services/auth-service.ts");
  const requestPasswordReset = service.slice(
    service.indexOf("export async function requestPasswordReset"),
  );
  const userLookupIndex = requestPasswordReset.indexOf("prisma.user.findUnique({");
  const pairScopeIndex = requestPasswordReset.indexOf(
    "RATE_LIMIT_SCOPES.forgotPassword",
  );
  const emailScopeIndex = requestPasswordReset.indexOf(
    "RATE_LIMIT_SCOPES.forgotPasswordEmail",
  );
  const ipScopeIndex = requestPasswordReset.indexOf(
    "RATE_LIMIT_SCOPES.forgotPasswordIp",
  );
  const blockedIndex = requestPasswordReset.indexOf("if (rateLimit)");

  assert.ok(pairScopeIndex > -1);
  assert.ok(emailScopeIndex > -1);
  assert.ok(ipScopeIndex > -1);
  assert.ok(blockedIndex > -1);
  assert.ok(pairScopeIndex < userLookupIndex);
  assert.ok(emailScopeIndex < userLookupIndex);
  assert.ok(ipScopeIndex < userLookupIndex);
  assert.ok(blockedIndex < userLookupIndex);
});

test("forgot-password email-only and IP-only keys cover distributed abuse", () => {
  const service = readSource("src/server/services/auth-service.ts");

  assert.match(
    service,
    /const emailRateLimitKey = createCompositeRateLimitKey\(\[\s*\{\s*kind: "email",\s*value: email,\s*\},\s*\]\);/s,
  );
  assert.match(
    service,
    /const ipRateLimitKey = createCompositeRateLimitKey\(\[\s*\{\s*kind: "ip",\s*value: ipAddress,\s*\},\s*\]\);/s,
  );
});

test("forgot-password Turnstile failure short-circuits before rate limits and email", () => {
  const route = readSource("src/app/api/auth/forgot-password/route.ts");
  const turnstileIndex = route.indexOf("verifyTurnstileToken({");
  const failedIndex = route.indexOf("if (!turnstile.ok)");
  const requestResetIndex = route.indexOf("requestPasswordReset(");

  assert.ok(turnstileIndex > -1);
  assert.ok(failedIndex > turnstileIndex);
  assert.ok(requestResetIndex > failedIndex);
});

test("forgot-password responses stay neutral for known and unknown emails", () => {
  const route = readSource("src/app/api/auth/forgot-password/route.ts");
  const service = readSource("src/server/services/auth-service.ts");

  assert.match(route, /safeSuccessMessage/);
  assert.doesNotMatch(route, /email_already_exists|user_not_found|account_not_found/);
  assert.match(service, /const result: RequestPasswordResetResult = \{\s*ok: true,\s*message: PASSWORD_RESET_SUCCESS_MESSAGE,\s*\}/s);
  assert.match(service, /if \(!user\) \{\s*return result;\s*\}/s);
});

test("forgot-password Turnstile respects enabled and disabled modes", () => {
  const page = readSource("src/app/[locale]/(auth)/forgot-password/page.tsx");
  const form = readSource("src/components/auth/forgot-password-form.tsx");
  const widget = readSource("src/components/auth/turnstile-widget.tsx");
  const route = readSource("src/app/api/auth/forgot-password/route.ts");
  const service = readSource("src/server/services/turnstile-service.ts");

  assert.match(page, /turnstileEnabled=\{isTurnstileEnabled\(\)\}/);
  assert.match(form, /\.\.\.\(turnstileEnabled \? \{ turnstileToken \} : \{\}\)/);
  assert.match(widget, /if \(!enabled \|\| !turnstileSiteKey\) \{\s*return null;\s*\}/s);
  assert.match(route, /verifyTurnstileToken\(\{[\s\S]*action: "forgot-password"[\s\S]*token: getStringProperty\(body, "turnstileToken"\)/);
  assert.match(route, /if \(!turnstile\.ok\) \{[\s\S]*status:\s*403/);

  const disabledCheckIndex = service.indexOf("if (!isTurnstileEnabled())");
  const fetchIndex = service.indexOf("fetch(TURNSTILE_SITEVERIFY_URL");

  assert.ok(disabledCheckIndex > -1);
  assert.ok(fetchIndex > -1);
  assert.ok(disabledCheckIndex < fetchIndex);
  assert.match(service, /!token \|\|/);
  assert.match(service, /reason: "invalid_token"/);
});

test("forgot-password reset tokens and dev URLs are not exposed outside local development", () => {
  const route = readSource("src/app/api/auth/forgot-password/route.ts");
  const service = readSource("src/server/services/auth-service.ts");

  assert.match(route, /process\.env\.NODE_ENV === "development" && result\.devResetUrl/);
  assert.match(service, /process\.env\.NODE_ENV === "development"/);
  assert.doesNotMatch(route, /rawToken|tokenHash|TURNSTILE_SECRET_KEY|SMTP_PASSWORD/);
  assert.doesNotMatch(service, /console\.(log|info|warn|error)\([^;\n]*(rawToken|devResetUrl|tokenHash)/);
});

test("forgot-password rate limit key uses normalized email plus conservative client IP", () => {
  const service = readSource("src/server/services/auth-service.ts");
  const rateLimitService = readSource("src/server/services/rate-limit-service.ts");

  assert.match(service, /const email = normalizeEmail\(input\.email\)/);
  assert.match(service, /createCompositeRateLimitKey\(\[[\s\S]*kind: "email"[\s\S]*value: email[\s\S]*kind: "ip"[\s\S]*value: ipAddress[\s\S]*\]\)/);
  assert.match(rateLimitService, /from "node:net"/);
  assert.match(rateLimitService, /isIP/);
  assert.ok(
    rateLimitService.indexOf('"cf-connecting-ip"') <
      rateLimitService.indexOf('"x-forwarded-for"'),
  );
});

test("forgot-password client does not expose server-only secrets", () => {
  const form = readSource("src/components/auth/forgot-password-form.tsx");
  const widget = readSource("src/components/auth/turnstile-widget.tsx");

  for (const source of [form, widget]) {
    assert.doesNotMatch(source, /TURNSTILE_SECRET_KEY|SMTP_PASSWORD|SMTP_USER|DATABASE_URL|NEXTAUTH_SECRET/);
  }

  assert.match(widget, /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
});
