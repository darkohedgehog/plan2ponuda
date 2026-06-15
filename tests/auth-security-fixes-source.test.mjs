import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("auth email links use a canonical server-side origin outside development", () => {
  const helperPath = "src/lib/auth/auth-email-origin.ts";
  const helper = readSource(helperPath);
  const forgotRoute = readSource("src/app/api/auth/forgot-password/route.ts");
  const signUpRoute = readSource("src/app/api/auth/sign-up/route.ts");
  const resendRoute = readSource(
    "src/app/api/auth/resend-verification/route.ts",
  );

  assert.ok(existsSync(new URL(`../${helperPath}`, import.meta.url)));
  assert.match(helper, /import "server-only"/);
  assert.match(helper, /APP_ORIGIN/);
  assert.match(helper, /NEXTAUTH_URL/);
  assert.match(helper, /NEXT_PUBLIC_APP_URL/);
  assert.match(helper, /NEXT_PUBLIC_SITE_URL/);
  assert.match(helper, /NODE_ENV === "development"/);
  assert.match(helper, /url\.protocol !== "https:"/);
  assert.match(helper, /allowedHostnames/);
  assert.doesNotMatch(helper, /return new URL\(request\.url\)\.origin/);

  for (const route of [forgotRoute, signUpRoute, resendRoute]) {
    assert.match(route, /getAuthEmailOrigin/);
    assert.doesNotMatch(route, /function getBaseUrl/);
    assert.doesNotMatch(route, /return new URL\(request\.url\)\.origin/);
  }
});

test("debug reset and verification URLs are returned only in development", () => {
  const forgotRoute = readSource("src/app/api/auth/forgot-password/route.ts");
  const authService = readSource("src/server/services/auth-service.ts");

  assert.match(
    forgotRoute,
    /process\.env\.NODE_ENV === "development" && result\.devResetUrl/,
  );
  assert.match(
    authService,
    /process\.env\.NODE_ENV === "development" && exposeDevVerificationUrl/,
  );
  assert.doesNotMatch(authService, /NODE_ENV !== "production"/);
  assert.doesNotMatch(authService, /console\.(log|info|warn|error)\([^;\n]*(devResetUrl|devVerificationUrl|rawToken|tokenHash)/);
});

test("password reset issuance revokes older unused reset tokens before creating a new one", () => {
  const authService = readSource("src/server/services/auth-service.ts");
  const requestReset = authService.slice(
    authService.indexOf("export async function requestPasswordReset"),
    authService.indexOf("function shouldSendPasswordResetEmail"),
  );
  const revokeIndex = requestReset.indexOf("passwordResetToken.updateMany");
  const createIndex = requestReset.indexOf("passwordResetToken.create");

  assert.ok(revokeIndex > -1);
  assert.ok(createIndex > revokeIndex);
  assert.match(
    requestReset,
    /passwordResetToken\.updateMany\(\{[\s\S]*userId:\s*user\.id[\s\S]*usedAt:\s*null[\s\S]*usedAt:\s*now/s,
  );
});

test("password reset completion atomically claims one valid token before changing password", () => {
  const authService = readSource("src/server/services/auth-service.ts");
  const resetPassword = authService.slice(
    authService.indexOf("export async function resetPassword"),
    authService.indexOf("function shouldSendPasswordResetEmail"),
  );
  const claimIndex = resetPassword.indexOf("passwordResetToken.updateMany");
  const countCheckIndex = resetPassword.indexOf("claimResult.count !== 1");
  const hashIndex = resetPassword.indexOf("const passwordHash = await hashPassword");
  const userUpdateIndex = resetPassword.indexOf("transaction.user.update");

  assert.ok(claimIndex > -1);
  assert.ok(countCheckIndex > claimIndex);
  assert.ok(hashIndex > countCheckIndex);
  assert.ok(userUpdateIndex > hashIndex);
  assert.match(resetPassword, /tokenHash/);
  assert.match(resetPassword, /usedAt:\s*null/);
  assert.match(resetPassword, /expiresAt:\s*\{\s*gt:\s*now,?\s*\}/s);
  assert.match(resetPassword, /include:\s*\{\s*user:\s*\{\s*select:\s*\{\s*id:\s*true/s);
  assert.doesNotMatch(
    resetPassword,
    /passwordResetToken\.findUnique\([\s\S]*usedAt[\s\S]*expiresAt/,
  );
});

test("sign-in uses layered DB-backed rate limits before password verification", () => {
  const rateLimitService = readSource("src/server/services/rate-limit-service.ts");
  const nextAuthRoute = readSource("src/app/api/auth/[...nextauth]/route.ts");

  assert.match(rateLimitService, /signInEmailIp:\s*"sign_in_email_ip"/);
  assert.match(rateLimitService, /signInEmail:\s*"sign_in_email"/);
  assert.match(rateLimitService, /signInIp:\s*"sign_in_ip"/);
  assert.match(
    rateLimitService,
    /signInEmail:\s*\{\s*limit:\s*10,\s*windowSeconds:\s*15 \* 60/s,
  );
  assert.match(
    rateLimitService,
    /signInIp:\s*\{\s*limit:\s*30,\s*windowSeconds:\s*15 \* 60/s,
  );

  for (const scope of ["signInEmailIp", "signInEmail", "signInIp"]) {
    assert.match(nextAuthRoute, new RegExp(`RATE_LIMIT_SCOPES\\.${scope}`));
  }

  assert.ok(
    nextAuthRoute.indexOf("checkSignInRateLimit") <
      nextAuthRoute.indexOf("const turnstile = await verifyTurnstileToken"),
  );
  assert.match(nextAuthRoute, /checkSignInRateLimit/);
});

test("reset-password completion is rate limited without storing raw tokens", () => {
  const route = readSource("src/app/api/auth/reset-password/route.ts");
  const rateLimitService = readSource("src/server/services/rate-limit-service.ts");

  assert.match(route, /checkRateLimitOrThrow/);
  assert.match(route, /RATE_LIMIT_SCOPES\.resetPassword/);
  assert.match(route, /createCompositeRateLimitKey/);
  assert.match(route, /getRateLimitHeaders/);
  assert.match(route, /status:\s*429/);
  assert.doesNotMatch(route, /tokenHash|hashPasswordResetToken|rawToken/);
  assert.match(rateLimitService, /resetPassword:\s*"reset_password"/);
  assert.match(
    rateLimitService,
    /resetPassword:\s*\{\s*limit:\s*10,\s*windowSeconds:\s*15 \* 60/s,
  );
});

test("Turnstile fails closed outside development and validates allowed hostnames", () => {
  const service = readSource("src/server/services/turnstile-service.ts");
  const envExample = readSource(".env.example");
  const deploymentChecklist = readSource(".codex/DEPLOYMENT_CHECKLIST.md");
  const securityReport = readSource("security_best_practices_report.md");

  assert.match(service, /isLocalDevelopment/);
  assert.match(service, /TURNSTILE_ALLOWED_HOSTNAMES/);
  assert.match(service, /missing_secret/);
  assert.match(service, /hostname_mismatch/);
  assert.match(service, /allowedHostnames/);
  assert.match(service, /result\.hostname/);
  assert.match(service, /TURNSTILE_ENABLED/);
  assert.match(service, /NODE_ENV === "development"/);

  assert.match(envExample, /APP_ORIGIN=/);
  assert.match(envExample, /AUTH_EMAIL_ALLOWED_ORIGINS=/);
  assert.match(envExample, /TURNSTILE_ALLOWED_HOSTNAMES=/);
  assert.match(deploymentChecklist, /APP_ORIGIN/);
  assert.match(deploymentChecklist, /TURNSTILE_ALLOWED_HOSTNAMES/);
  assert.match(securityReport, /APP_ORIGIN/);
  assert.match(securityReport, /TURNSTILE_ALLOWED_HOSTNAMES/);
});
