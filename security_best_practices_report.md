# Security Best Practices Report

## Executive Summary

No unsafe raw SQL or SQL-injection issue was found in the audited application code. The repository now also has source-level regression coverage for raw SQL usage, Turnstile auth protection, verified-email gating, and endpoint rate limits.

## Raw SQL / Injection Audit

### Finding SQL-001

- Severity: Low
- Location: `src/server/services/project-service.ts:392`, `src/server/services/quote-service.ts:231`, `src/server/services/rate-limit-service.ts:177`, `src/server/services/rate-limit-service.ts:221`, `src/server/services/rate-limit-service.ts:260`
- Evidence: raw queries use Prisma tagged templates or `Prisma.sql`, with user-controlled values passed as parameters.
- Impact: SQL syntax is not assembled from untrusted strings in the reviewed sinks, so SQL injection is not currently indicated.
- Fix: No code fix required.
- Mitigation: Keep `tests/raw-sql-security-audit.test.mjs` in place to reject `$queryRawUnsafe`, `$executeRawUnsafe`, direct `pg` clients, and string-built SQL.
- False positive notes: This review covered app-owned raw SQL sinks found by source search. Generated Prisma client code and migration SQL were not treated as request-facing injection sinks.

## Cloudflare WAF Rules To Configure

Configure these in Cloudflare at the zone/domain level, outside the repo:

- Enable Cloudflare managed WAF rules and Bot Fight Mode or Bot Management if available.
- Add a custom rule to challenge or block high-risk auth/API paths when bot score or threat score is poor:
  `http.request.uri.path in {"/api/auth/sign-up" "/api/auth/forgot-password" "/api/auth/callback/credentials"} and http.request.method eq "POST"`
- Add Cloudflare rate limiting rules for auth endpoints:
  `/api/auth/sign-up`, `/api/auth/forgot-password`, `/api/auth/callback/credentials`.
- Add Cloudflare rate limiting rules for expensive app endpoints:
  `/api/analysis/*`, `/api/projects/*/upload`, `/api/projects/*/documents/upload`, `/api/projects/*/documents/*/analyze`, `/api/quotes/*`.
- Keep origin-side DB rate limits enabled. Cloudflare limits reduce edge abuse; origin limits still protect authenticated-user quotas and bypass scenarios.
