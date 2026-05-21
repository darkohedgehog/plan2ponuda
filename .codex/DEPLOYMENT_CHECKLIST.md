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

- App: `NEXT_PUBLIC_APP_URL`; `NODE_ENV` is runtime-managed and normally not
  manually set in production.
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
- Confirm `SUPABASE_SECRET_KEY` is configured server-side only.
- Confirm `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anon key are safe for
  browser use.

## 4. Auth And Admin Access

- Generate a strong `NEXTAUTH_SECRET`.
- Set `NEXTAUTH_URL` to the production app URL.
- Register the initial owner/admin account through the normal sign-up flow.
- Promote the first admin intentionally by a controlled one-off data operation
  using Prisma or a restricted database console.
- Verify the promoted user has `User.role = admin`.
- Limit who can perform future admin promotions and record the operational
  reason for each change.
- Confirm `/dashboard/admin/billing` is inaccessible to non-admin users.

## 5. OpenAI

- Configure `OPENAI_API_KEY` server-side only.
- Do not expose the OpenAI key to client code or `NEXT_PUBLIC_*`.
- Leave `OPENAI_ANALYSIS_MODEL` unset unless intentionally overriding the app
  default.
- Run one small AI analysis smoke test after deployment and verify usage/rate
  limiting still applies.

## 6. Stripe

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
  `invoice.paid`, `invoice.payment_failed`.
- Copy the production endpoint signing secret into production
  `STRIPE_WEBHOOK_SECRET`.
- Confirm webhook signatures are verified and duplicate events are idempotent.

## 7. SMTP Password Reset Email

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

## 8. Synesis Manual Invoice Operations

- Treat Stripe as the source of truth for payment/subscription state.
- Treat Synesis/manual work as the local legal invoice workflow.
- Do not create Synesis invoices automatically from code.
- After `invoice.paid`, check that an `InvoiceTask` exists for cases requiring
  manual invoice review.
- In the admin billing dashboard, review customer type, billing snapshot,
  amount, currency, Stripe invoice ID, and billing period.
- Issue the invoice manually in Synesis when required.
- Enter the Synesis invoice number before marking a task `issued`.
- Use `needs_review`, `failed`, or `not_required` when the task cannot be
  issued directly.
- Reconcile Stripe invoice/payment IDs against Synesis records before closing
  the task.

## 9. Production Smoke Test

- App home/localized routes load over HTTPS.
- Sign-up creates a new user.
- Sign-in and sign-out work.
- Forgot-password sends an email without revealing whether the account exists.
- Password reset succeeds once and the same link cannot be reused.
- Dashboard requires authentication.
- Admin billing dashboard requires an admin user.
- Supabase project upload path can create/read a private project file.
- AI analysis works for an authenticated user under the rate limit.
- Repeated AI and auth requests are rate limited safely.
- Quote generation still works for a reviewed project.
- PDF/Excel exports still work for an existing project.
- Stripe checkout creates a session with the expected plan price.
- Stripe webhook updates subscription state and creates invoice tasks when
  expected.
- SMTP, Stripe, Supabase, OpenAI, and database secrets do not appear in client
  bundles or logs.

## 10. Pre-Release Verification Commands

```bash
npm run typecheck
npm run lint
npm run build
npm audit
```

## 11. Known TODOs

- Add a dedicated, audited admin-promotion script or admin management flow.
- Add an operational runbook for rotating SMTP, Stripe, Supabase, OpenAI, and
  NextAuth secrets.
- Confirm final accountant-approved Synesis statuses and wording before broad
  production billing rollout.
