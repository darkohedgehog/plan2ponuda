import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Next config applies centralized baseline security headers to all routes", () => {
  const source = readSource("next.config.ts");

  assert.match(source, /async headers\(\)/);
  assert.match(source, /source:\s*"\/:path\*"/);
  assert.match(source, /X-Content-Type-Options/);
  assert.match(source, /nosniff/);
  assert.match(source, /Referrer-Policy/);
  assert.match(source, /strict-origin-when-cross-origin/);
  assert.match(source, /Permissions-Policy/);
  assert.match(source, /X-Frame-Options/);
  assert.match(source, /DENY/);
});

test("HSTS is gated to production and CSP is documented instead of blindly enforced", () => {
  const configSource = readSource("next.config.ts");
  const checklist = readSource(".codex/DEPLOYMENT_CHECKLIST.md");
  const report = readSource("security_best_practices_report.md");

  assert.match(configSource, /process\.env\.NODE_ENV === "production"/);
  assert.match(configSource, /Strict-Transport-Security/);
  assert.match(configSource, /max-age=31536000/);
  assert.doesNotMatch(configSource, /Content-Security-Policy/);
  assert.match(checklist, /Content-Security-Policy/);
  assert.match(checklist, /Stripe/);
  assert.match(checklist, /Cloudflare Turnstile/);
  assert.match(report, /Content-Security-Policy/);
  assert.match(report, /challenges\.cloudflare\.com/);
  assert.match(report, /js\.stripe\.com/);
});
