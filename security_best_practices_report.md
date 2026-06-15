# Security Best Practices Report

## Executive Summary

No unsafe raw SQL or SQL-injection issue was found in the audited application code. The repository now also has source-level regression coverage for raw SQL usage, Turnstile auth protection, verified-email gating, and endpoint rate limits.

## Auth Email Origin And Token Handling

- Configure `APP_ORIGIN` to the canonical HTTPS app origin in staging and
  production. Auth email links must not fall back to request `Host` headers
  outside local development.
- Configure `AUTH_EMAIL_ALLOWED_ORIGINS` with explicit staging/production
  hostnames or HTTPS origins so reset and verification links are deterministic.
- Debug reset and verification URLs are only returned by API responses when
  `NODE_ENV === "development"`.
- Password reset requests revoke older unused reset tokens before issuing a new
  token, and reset completion atomically claims a valid unused token before
  updating the password.

## Raw SQL / Injection Audit

### Finding SQL-001

- Severity: Low
- Location: `src/server/services/project-service.ts:392`, `src/server/services/quote-service.ts:231`, `src/server/services/rate-limit-service.ts:177`, `src/server/services/rate-limit-service.ts:221`, `src/server/services/rate-limit-service.ts:260`
- Evidence: raw queries use Prisma tagged templates or `Prisma.sql`, with user-controlled values passed as parameters.
- Impact: SQL syntax is not assembled from untrusted strings in the reviewed sinks, so SQL injection is not currently indicated.
- Fix: No code fix required.
- Mitigation: Keep `tests/raw-sql-security-audit.test.mjs` in place to reject `$queryRawUnsafe`, `$executeRawUnsafe`, direct `pg` clients, and string-built SQL.
- False positive notes: This review covered app-owned raw SQL sinks found by source search. Generated Prisma client code and migration SQL were not treated as request-facing injection sinks.

## Supabase Storage Bucket Privacy

- Bucket `project-files` must be private; anon reads/writes must fail when
  tested with the publishable/anon key.
- Only the server/service role should write objects to `project-files`.
- Project file previews should use signed URLs. The app uses server-side
  signing for floor-plan previews instead of public bucket URLs.
- The service role key must never be exposed client-side or through
  `NEXT_PUBLIC_*`.
- Do not add automatic bucket mutation in the app runtime. Verify bucket
  privacy during deployment and keep storage writes behind server-side code.

## Security Headers And CSP

- The app sets centralized baseline browser security headers in `next.config.ts`:
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options`, and production-only `Strict-Transport-Security`.
- Do not enforce a strict `Content-Security-Policy` without staging validation.
  Use report-only first if needed, and allow app assets, Stripe
  (`https://js.stripe.com` and Stripe checkout/API domains), Cloudflare
  Turnstile (`https://challenges.cloudflare.com`), and required fonts/images.
- Confirm HSTS is only served over production HTTPS and matches the final
  domain/subdomain policy before launch.

## Cloudflare WAF Rules To Configure

Configure these in Cloudflare at the zone/domain level, outside the repo:

- Enable Cloudflare managed WAF rules and Bot Fight Mode or Bot Management if available.
- Add a custom rule to challenge or block high-risk auth/API paths when bot score or threat score is poor:
  `http.request.uri.path in {"/api/auth/sign-up" "/api/auth/forgot-password" "/api/auth/callback/credentials"} and http.request.method eq "POST"`
- Add Cloudflare rate limiting rules for auth endpoints:
  `/api/auth/sign-up`, `/api/auth/forgot-password`, `/api/auth/callback/credentials`.
- Use a low threshold for `POST /api/auth/forgot-password` to reduce reset
  email abuse, while keeping the origin-side DB rate limit as the source of
  truth for bypass and direct-origin scenarios.
- The origin app enforces layered DB-backed forgot-password limits:
  3 requests per 15 minutes per normalized email/client IP pair, 5 requests per
  hour per normalized email, and 10 requests per 15 minutes per client IP.
- The origin app enforces layered DB-backed sign-in limits:
  10 requests per 10 minutes per normalized email/client IP pair, 10 requests
  per 15 minutes per normalized email, and 30 requests per 15 minutes per
  client IP.
- The origin app rate-limits password-reset completion:
  10 requests per 15 minutes per client IP.
- Configure `TURNSTILE_ALLOWED_HOSTNAMES` with exact staging and production
  hostnames. In non-development environments, Turnstile verification fails
  closed when config is missing or the returned hostname is not allowed.
- Add Cloudflare rate limiting rules for expensive app endpoints:
  `/api/analysis/*`, `/api/projects/*/upload`, `/api/projects/*/documents/upload`, `/api/projects/*/documents/*/analyze`, `/api/quotes/*`.
- Keep origin-side DB rate limits enabled. Cloudflare limits reduce edge abuse; origin limits still protect authenticated-user quotas and bypass scenarios.
- Do not apply Turnstile, managed challenges, or bot challenges to
  `/api/stripe/webhook`; Stripe webhooks must remain machine-callable and are
  protected by signature verification in the app.
