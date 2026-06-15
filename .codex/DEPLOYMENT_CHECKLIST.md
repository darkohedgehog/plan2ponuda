# Deployment Checklist

Use this checklist before promoting Plan2Ponuda / Ploro AI to production. It is
documentation only and must not contain real secrets.

## 1. Environment Variables

Use `.env.example` as the source of required keys.

- `NEXT_PUBLIC_*` variables are public and browser-visible.
- Every other variable is server-only and must be configured in `.env.local`,
  Vercel Environment Variables, or the production host secret store.
- Never put provider secrets, SMTP passwords, Stripe secrets, OpenAI keys, or
  Supabase secret keys in `NEXT_PUBLIC_*`.
- Quote values with spaces or special characters, especially
  `SMTP_FROM_NAME` and `SMTP_PASSWORD`.

Required groups:

- App: `APP_ORIGIN`, `AUTH_EMAIL_ALLOWED_ORIGINS`,
  `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`; `NODE_ENV` is
  runtime-managed and normally not manually set in production.
- Database: `DATABASE_URL`.
- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SECRET_KEY`.
- OpenAI: `OPENAI_API_KEY`; optional `OPENAI_ANALYSIS_MODEL`.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_BASIC_PRICE_ID`,
  `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
  `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`.
- Cloudflare Turnstile: `TURNSTILE_ENABLED`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
  `TURNSTILE_ALLOWED_HOSTNAMES`.

## 2. Database And Prisma

- Confirm production `DATABASE_URL` points to the intended Postgres database.
- For hosted/serverless runtime, prefer the Supabase transaction pooler where
  appropriate.
- Apply schema changes through Prisma only:

```bash
npx prisma migrate deploy
npx prisma generate
```

- Do not edit production schema manually.
- Confirm the `RateLimitBucket` migration is applied before running production
  traffic across multiple instances.

## 3. Supabase

- Enable Supabase Database and Storage.
- Create the private Storage bucket:

```text
project-files
```

- Keep the bucket private and use server-controlled upload/download flows.
- Bucket `project-files` must be private; anon reads/writes must fail when
  tested with the publishable/anon key.
- Only the server/service role should write objects to `project-files`.
- Project previews must use signed URLs, not public bucket URLs.
- The service role key must never be exposed client-side or through
  `NEXT_PUBLIC_*`.
- Confirm `SUPABASE_SECRET_KEY` is configured server-side only.
- Confirm `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anon key are safe for
  browser use.
- If an Nginx or equivalent reverse proxy sits in front of the app, set upload
  body limits no lower than the app route limits: `client_max_body_size 11m`
  for floor-plan uploads and `client_max_body_size 21m` for project-document
  uploads. These match the 10MB and 20MB file limits plus multipart overhead.

Security headers and CSP:

- Confirm `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, and clickjacking protection are present on public and
  dashboard routes.
- Confirm `Strict-Transport-Security` is present only on production HTTPS
  responses and matches the final HSTS policy for the deployed domain.
- Do not enforce a strict `Content-Security-Policy` until it has been tested in
  staging. Start with report-only if needed, and allow app assets, Stripe
  (`https://js.stripe.com` and Stripe checkout/API domains), Cloudflare
  Turnstile (`https://challenges.cloudflare.com`), and required fonts/images.

## 4. Auth And Admin Access

- Set `APP_ORIGIN` to the canonical HTTPS staging/production app origin used
  in password-reset and email-verification links.
- Set `AUTH_EMAIL_ALLOWED_ORIGINS` to the explicit staging/production
  hostnames or HTTPS origins allowed for auth email links.
- Confirm auth email links do not fall back to request `Host` headers outside
  local development.
- Generate a strong `NEXTAUTH_SECRET`.
- Set `NEXTAUTH_URL` to the production app URL.
- Register the initial owner/admin account through the normal sign-up flow.
- Complete email verification for the initial owner/admin account before using
  upload, AI analysis, quote export, or paid/resource-gated flows.
- Promote the first admin intentionally by a controlled one-off data operation
  using Prisma or a restricted database console.
- Verify the promoted user has `User.role = admin`.
- Verify the promoted user has `User.emailVerifiedAt` set. For migrated
  existing users/admins, either send and complete the normal verification flow
  or intentionally backfill `emailVerifiedAt` through a controlled one-off data
  operation.
- Limit who can perform future admin promotions and record the operational
  reason for each change.
- Confirm `/dashboard/admin/billing` is inaccessible to non-admin users.

## 5. Cloudflare Turnstile And Email Verification

Local development:

- Keep `TURNSTILE_ENABLED=false` unless intentionally testing Turnstile.
- With `TURNSTILE_ENABLED=false`, auth pages should not render the Turnstile
  widget or load `https://challenges.cloudflare.com/turnstile/...`.
- Sign-up, sign-in, forgot-password, and password reset should continue to work
  locally without a Turnstile token.
- If testing Turnstile on localhost, add `localhost` as an allowed hostname in
  Cloudflare or use an appropriate test setup.

Staging/production setup:

- Set `TURNSTILE_ENABLED=true`.
- Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` from Cloudflare Turnstile. This key is
  browser-safe.
- Set `TURNSTILE_SECRET_KEY` from Cloudflare Turnstile. This key is server-only.
- Set `TURNSTILE_ALLOWED_HOSTNAMES` to the exact staging and production
  hostnames that Cloudflare Turnstile may return.
- Add the staging and production domains to the Cloudflare Turnstile allowed
  hostnames list before testing auth.
- Confirm an invalid or missing Turnstile token is rejected on sign-up,
  sign-in, and forgot-password.
- Confirm a Turnstile token issued for an unlisted hostname is rejected.

Cloudflare WAF/rate-limit notes:

- Keep app-level Turnstile and DB-backed rate limits enabled for auth forms;
  Cloudflare is defense in depth, not the only protection.
- The app enforces layered forgot-password limits before user lookup or email:
  3 requests per 15 minutes per normalized email/client IP pair, 5 requests per
  hour per normalized email, and 10 requests per 15 minutes per client IP.
- The app enforces layered sign-in limits before password verification:
  10 requests per 10 minutes per normalized email/client IP pair, 10 requests
  per 15 minutes per normalized email, and 30 requests per 15 minutes per
  client IP.
- The app enforces password-reset completion limits: 10 requests per
  15 minutes per client IP.
- Add a low-threshold Cloudflare rate-limit rule for
  `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`.
- Allow normal browsers through and avoid exposing the origin port directly.
- Do not apply Turnstile, managed challenges, or bot challenges to
  `/api/stripe/webhook`; Stripe webhooks must reach the app for signature
  verification.

Staging smoke checklist:

- Test sign-up with Turnstile enabled.
- Complete the email verification link for the new account.
- Test sign-in with Turnstile enabled.
- Test forgot-password and reset-password.
- Confirm an unverified user is blocked before upload, AI analysis, quote
  generation/export, and paid/resource-gated routes.
- Confirm a verified user can use upload, AI analysis, and quote flows within
  their plan.
- Test Free usage limits.
- Test Basic usage limits.

## 6. OpenAI

- Configure `OPENAI_API_KEY` server-side only.
- Do not expose the OpenAI key to client code or `NEXT_PUBLIC_*`.
- Leave `OPENAI_ANALYSIS_MODEL` unset unless intentionally overriding the app
  default.
- Run one small AI analysis smoke test after deployment and verify usage/rate
  limiting still applies.

## 7. Stripe

- Keep Stripe test mode and live mode completely separate.
- Local/staging should use `sk_test_*` keys and test `price_*` IDs.
- Production should use `sk_live_*` keys and live `price_*` IDs.
- Do not mix test webhook secrets with live API keys or live price IDs.
- Configure Stripe Customer Portal in the matching Stripe mode.

Local webhook setup:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

- Copy the printed `whsec_...` value into local `STRIPE_WEBHOOK_SECRET`.
- Trigger test checkout/subscription events and confirm webhook processing.

Production webhook setup:

- Create a Stripe Dashboard webhook endpoint:

```text
https://your-production-domain.example/api/stripe/webhook
```

- Select at least these events:
  `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.paid`, `invoice_payment.paid`, `invoice.payment_failed`.
- Copy the production endpoint signing secret into production
  `STRIPE_WEBHOOK_SECRET`.
- Confirm webhook signatures are verified and duplicate events are idempotent.

## 8. SMTP Password Reset And Verification Email

Hostinger example:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@example.com
SMTP_PASSWORD="replace-with-mailbox-password"
SMTP_FROM_EMAIL=contact@example.com
SMTP_FROM_NAME="Ploro AI"
```

- Do not commit the real SMTP password.
- Quote `SMTP_PASSWORD` and `SMTP_FROM_NAME` when they contain spaces or
  special characters.
- Submit forgot-password for an existing account and confirm email delivery.
- Submit forgot-password for an unknown email and confirm the response remains
  neutral.
- Confirm reset links expire and cannot be reused.
- Confirm requesting a new reset link invalidates older unused reset links.
- Submit sign-up for a new account and confirm verification email delivery.
- Confirm verification links set `User.emailVerifiedAt`, expire safely, and
  cannot be reused.

## 9. Synesis Manual Invoice Operations

- Treat Stripe as the source of truth for payment/subscription state.
- Treat Synesis/manual work as the local legal invoice workflow.
- Do not create Synesis invoices automatically from code.
- After `invoice.paid` or `invoice_payment.paid`, check that an `InvoiceTask`
  exists for cases requiring manual invoice review.
- In the admin billing dashboard, review customer type, billing snapshot,
  amount, currency, Stripe invoice ID, and billing period.
- Issue the invoice manually in Synesis when required.
- Enter the Synesis invoice number before marking a task `issued`.
- Use `needs_review`, `failed`, or `not_required` when the task cannot be
  issued directly.
- Reconcile Stripe invoice/payment IDs against Synesis records before closing
  the task.

## 10. Production Smoke Test

- App home/localized routes load over HTTPS.
- Sign-up creates a new user.
- New user receives and completes email verification.
- Sign-in and sign-out work.
- Forgot-password sends an email without revealing whether the account exists.
- Password reset succeeds once and the same link cannot be reused.
- Dashboard requires authentication.
- Admin billing dashboard requires an admin user.
- Unverified users are blocked before upload, AI analysis, quote
  generation/export, and paid/resource-gated routes.
- Supabase project upload path can create/read a private project file.
- AI analysis works for an authenticated user under the rate limit.
- Repeated AI and auth requests are rate limited safely.
- Free and Basic usage limits are enforced.
- Quote generation still works for a reviewed project.
- PDF/Excel exports still work for an existing project.
- Stripe checkout creates a session with the expected plan price.
- Stripe webhook updates subscription state and creates invoice tasks when
  expected.
- SMTP, Stripe, Supabase, OpenAI, and database secrets do not appear in client
  bundles or logs.

## 11. SEO, Sitemap, And Robots

- Confirm `NEXT_PUBLIC_SITE_URL` is the absolute production URL with `https://`
  and no localhost/staging value.
- Run `npm run build` and confirm the `postbuild` sitemap generation completes.
- Check `/sitemap.xml` and `/robots.txt` on the deployed domain.
- Confirm `/sitemap.xml` includes only localized public marketing/legal pages:
  `/hr`, `/en`, `/sr`, `/de`, `/sl` and their `/pricing`, `/privacy`,
  `/terms`, `/cookies`, `/complaints`, and `/contact` variants.
- Confirm `/sitemap.xml` excludes `/api/*`, dashboard routes, auth pages,
  admin/billing pages, and private project/quote/document routes.
- Confirm `/robots.txt` disallows private app/API/auth areas and points to the
  absolute production sitemap URL.
- Confirm canonical and hreflang tags render correctly for `/hr`, `/hr/pricing`,
  and `/en/pricing`.
- Submit the production sitemap in Google Search Console after deployment.

## 12. Pre-Release Verification Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run postbuild
npm audit
```

## 13. Known TODOs

- Add a dedicated, audited admin-promotion script or admin management flow.
- Add an operational runbook for rotating SMTP, Stripe, Supabase, OpenAI, and
  NextAuth secrets.
- Confirm final accountant-approved Synesis statuses and wording before broad
  production billing rollout.
