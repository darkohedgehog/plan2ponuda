# Plan2Ponuda Billing Architecture

This document defines the planned billing and subscription architecture for Plan2Ponuda.

Plan2Ponuda will use Stripe for subscription payments, while Croatian/legal invoice issuance will be tracked locally and handled manually in Synesis. Stripe payment state and local Synesis invoice state must remain separate because Stripe alone does not satisfy all local invoicing requirements and Synesis has no reliable API integration.

---

# 1. Goals

- Support Free, Basic, and Pro subscription plans.
- Use Stripe as the source of truth for payment collection and subscription state.
- Keep local billing profiles in Plan2Ponuda for Croatian/EU invoice requirements.
- Create an admin invoice task queue for paid subscriptions that require manual Synesis invoice issuance.
- Track Synesis invoice task status separately from Stripe invoice/payment status.
- Enforce plan limits for floor plans, quotes, and large PDF analyses.
- Allow users to cancel subscriptions through Stripe Customer Portal, preferably at period end.
- Keep the first implementation simple, auditable, and legally reviewable.

---

# 2. Non-goals

- Do not implement Stripe in the current phase.
- Do not automate Synesis invoice creation.
- Do not treat Stripe invoices as complete local/legal Croatian invoices.
- Do not build tax/legal decision logic that has not been verified by an accountant.
- Do not support complex enterprise contracts in the first paid billing release.
- Do not add payment providers other than Stripe.
- Do not store card data in Plan2Ponuda.

---

# 3. Plan Definitions and Usage Limits

Plan limits should be enforced server-side before creating floor plans, quotes, or large PDF analyses.

| Plan | Price | Floor plans | Quotes | Large project PDF analyses | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| Free | 0 EUR/month | 1 | 1 | 0 | Default plan for new users. |
| Basic | 10 EUR/month | 10 | 10 | 0 | First paid self-serve plan. |
| Pro | TBD | 20 | 20 | 2-3 | Intended for larger projects and heavier analysis usage. |

Recommended internal plan identifiers:

- `free`
- `basic`
- `pro`

Recommended usage dimensions:

- `floor_plans_created`
- `quotes_created`
- `large_pdf_analyses_used`

Usage reset policy:

- Free usage is lifetime or account-scoped until changed by product policy.
- Paid usage should reset per Stripe billing period.
- Usage counters should store the period window used for enforcement.

---

# 4. Stripe Role

Stripe is responsible for:

- Checkout for paid subscriptions.
- Subscription lifecycle state.
- Payment collection.
- Payment failure handling.
- Customer Portal subscription cancellation.
- Stripe-hosted payment method management.
- Stripe invoice/payment event emission through webhooks.

Stripe is the source of truth for:

- Whether the subscription is active, trialing, past due, canceled, or incomplete.
- Current billing period start and end.
- Stripe customer ID.
- Stripe subscription ID.
- Stripe price ID.
- Payment success or failure.

Stripe is not the source of truth for:

- Synesis invoice issuance.
- Croatian/local legal invoice status.
- Whether an admin has manually issued an invoice.
- Accountant-approved customer classification.

---

# 5. Synesis / Manual Invoicing Role

Synesis is responsible for local/legal invoice issuance where required.

Because Synesis has no reliable API integration:

- Plan2Ponuda should not attempt automatic invoice creation in Synesis.
- Plan2Ponuda should create local invoice tasks for admin processing.
- Admins manually issue invoices in Synesis.
- Admins update invoice task status in Plan2Ponuda after manual work is complete.
- Stripe invoice/payment identifiers should be available in the admin queue for reconciliation.

Synesis invoice task tracking should include:

- Who needs an invoice.
- Which Stripe payment or invoice triggered the task.
- Which subscription period the task covers.
- Customer type and billing fields available at the time of payment.
- Current task status.
- Admin notes.
- Synesis invoice number when issued.

---

# 6. Customer Types and Required Billing Fields

Customer type should be captured in `BillingProfile` before starting paid checkout, or during checkout onboarding if the UX requires it.

Recommended enum values:

- `croatian_individual`
- `croatian_business_b2b`
- `croatian_b2g`
- `eu_business`
- `eu_b2g_needs_review`
- `outside_eu`

Common required fields:

- `customerType`
- `billingName`
- `billingEmail`
- `billingAddressLine1`
- `billingCity`
- `billingPostalCode`
- `billingCountry`

Recommended optional/common fields:

- `billingAddressLine2`
- `contactPerson`
- `phone`
- `notes`

Customer-type-specific requirements:

| Customer type | Required fields | Notes |
| --- | --- | --- |
| Croatian individual | Name, email, address, city, postal code, country | OIB may be optional or required depending on accountant guidance. |
| Croatian business B2B | Company name, email, address, city, postal code, country, OIB/VAT ID | Usually requires company legal name and Croatian OIB. |
| Croatian B2G | Institution name, email, address, city, postal code, country, OIB/VAT ID, contact person | May need purchase order, e-racun, or procurement references. Verify with accountant. |
| EU business | Company name, email, address, city, postal code, country, VAT ID | VAT validation and reverse-charge treatment must be verified. |
| EU B2G / needs review | Institution name, email, address, city, postal code, country, VAT ID if available, contact person | Always route to `needs_review` until accountant-approved rules exist. |
| Outside EU | Name/company name, email, address, city, postal code, country | Tax handling depends on jurisdiction and customer status. Verify with accountant. |

Recommended additional fields for review-heavy customer types:

- `vatId`
- `taxId`
- `oib`
- `purchaseOrderNumber`
- `eInvoiceReference`
- `procurementReference`

Billing profiles should be versioned by timestamp rather than overwritten invisibly. At minimum, invoice tasks should snapshot relevant billing fields at task creation so later profile edits do not change historical invoice context.

---

# 7. Subscription Lifecycle

Recommended lifecycle:

1. User starts on Free plan.
2. User completes or updates `BillingProfile` before paid checkout.
3. User selects Basic or Pro.
4. App creates a Stripe Checkout Session.
5. Stripe redirects user to checkout.
6. Stripe sends webhook events after checkout and payment changes.
7. App stores or updates local `Subscription` from webhook data.
8. App updates plan access and usage period.
9. App creates `InvoiceTask` when a paid invoice/payment requires manual Synesis work.
10. Admin processes the invoice task in Synesis.
11. Admin marks the task `issued`, `failed`, `needs_review`, or `not_required`.

Subscription state should be derived from Stripe webhooks, not from client redirects.

Client success pages may show a pending confirmation state until the webhook has updated local state.

---

# 8. Cancellation Behavior

Cancellation should be handled through Stripe Customer Portal where possible.

Preferred behavior:

- User opens Stripe Customer Portal from Plan2Ponuda billing settings.
- User cancels subscription in Stripe.
- Stripe schedules cancellation at period end.
- Local `Subscription.cancelAtPeriodEnd` becomes `true`.
- User keeps paid access until `currentPeriodEnd`.
- After period end, Stripe sends final lifecycle events.
- Local plan access returns to Free unless another active subscription exists.

Immediate cancellation should be admin-only or exceptional because it affects access and invoice reconciliation.

The user billing page should clearly show:

- Current plan.
- Subscription status.
- Current period end date.
- Whether cancellation is scheduled.
- Link to Customer Portal.

---

# 9. Webhook Events to Handle

Minimum Stripe webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Recommended additional webhook events:

- `invoice.finalized`
- `invoice.voided`
- `customer.updated`
- `customer.deleted`

Event handling rules:

- Webhook handlers must verify Stripe signatures.
- Webhook processing must be idempotent.
- Store every received Stripe event ID before or during processing.
- Ignore duplicate event IDs.
- Treat Stripe webhooks as authoritative over client callback URLs.
- Create invoice tasks from paid invoice/payment events, not from optimistic checkout redirects.

---

# 10. Prisma Models Proposal

The following models are a proposal only. They should be added in a later implementation phase after legal/accounting decisions are confirmed.

## Enums

```prisma
enum BillingPlan {
  free
  basic
  pro
}

enum SubscriptionStatus {
  incomplete
  trialing
  active
  past_due
  canceled
  unpaid
  paused
}

enum CustomerType {
  croatian_individual
  croatian_business_b2b
  croatian_b2g
  eu_business
  eu_b2g_needs_review
  outside_eu
}

enum InvoiceTaskStatus {
  pending
  issued
  failed
  needs_review
  not_required
}

enum UsageCounterType {
  floor_plans_created
  quotes_created
  large_pdf_analyses_used
}
```

## Subscription

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  plan                 BillingPlan        @default(free)
  status               SubscriptionStatus @default(active)
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  canceledAt           DateTime?
  trialEndsAt          DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([plan])
  @@index([status])
  @@index([currentPeriodEnd])
}
```

Notes:

- `userId` is unique for the first implementation because each user has one active billing relationship.
- Stripe IDs are nullable so Free users do not need Stripe records.
- `status` should mirror the normalized Stripe subscription status.

## BillingProfile

```prisma
model BillingProfile {
  id                  String       @id @default(cuid())
  userId              String       @unique
  customerType        CustomerType
  billingName         String
  billingEmail        String
  billingAddressLine1 String
  billingAddressLine2 String?
  billingCity         String
  billingPostalCode   String
  billingCountry      String
  companyName         String?
  contactPerson       String?
  vatId               String?
  taxId               String?
  oib                 String?
  phone               String?
  purchaseOrderNumber String?
  eInvoiceReference   String?
  procurementReference String?
  notes               String?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  user                User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([customerType])
  @@index([billingCountry])
}
```

Notes:

- Billing profile should not be treated as an invoice record.
- Invoice tasks should snapshot billing profile data when generated.
- Sensitive fields should be limited to what is required for invoicing.

## BillingEvent

`BillingEvent` stores Stripe webhook events and processing state. This model is the idempotency foundation.

```prisma
model BillingEvent {
  id             String    @id @default(cuid())
  stripeEventId  String    @unique
  eventType      String
  processedAt    DateTime?
  processingError String?
  payload        Json
  createdAt      DateTime  @default(now())

  @@index([eventType])
  @@index([processedAt])
  @@index([createdAt])
}
```

## InvoiceTask

`InvoiceTask` tracks the local/manual Synesis workflow. It should be separate from `BillingEvent`.

```prisma
model InvoiceTask {
  id                  String            @id @default(cuid())
  userId              String
  status              InvoiceTaskStatus @default(pending)
  stripeCustomerId    String?
  stripeSubscriptionId String?
  stripeInvoiceId     String?
  stripePaymentIntentId String?
  stripeEventId       String?
  periodStart         DateTime?
  periodEnd           DateTime?
  amountPaid          Decimal?          @db.Decimal(10, 2)
  currency            String            @default("EUR")
  customerType        CustomerType
  billingSnapshot     Json
  synesisInvoiceNumber String?
  adminNotes          String?
  reviewedAt          DateTime?
  issuedAt            DateTime?
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  user                User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([status, createdAt])
  @@index([stripeInvoiceId])
  @@unique([stripeInvoiceId])
}
```

Notes:

- `billingSnapshot` should contain the billing fields used for manual invoice issuance.
- `stripeInvoiceId` should be unique when available to prevent duplicate tasks for one paid Stripe invoice.
- Some events may not have all Stripe IDs, so Stripe ID fields are nullable.

## UsageCounter

```prisma
model UsageCounter {
  id          String           @id @default(cuid())
  userId      String
  type        UsageCounterType
  periodKey   String           @default("lifetime")
  count       Int              @default(0)
  periodStart DateTime?
  periodEnd   DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, type])
  @@index([periodEnd])
  @@unique([userId, type, periodKey])
}
```

Notes:

- Usage should be incremented in the same transaction as the action being limited where possible.
- Free-plan usage can use `periodKey = "lifetime"` and null period fields if the chosen policy is lifetime usage.
- Paid-plan usage should align with Stripe `currentPeriodStart` and `currentPeriodEnd`.
- Paid-plan `periodKey` should be a stable billing-period key, for example `${currentPeriodStart}-${currentPeriodEnd}` or the Stripe invoice/subscription period identifier if available.

---

# 11. Admin Billing Dashboard Requirements

Admin dashboard should provide a queue for invoice tasks and billing review.

Required list filters:

- Status: `pending`, `issued`, `failed`, `needs_review`, `not_required`
- Customer type
- Plan
- Date range
- Stripe invoice ID
- Synesis invoice number

Required task columns:

- Created date
- User email
- Billing name/company
- Customer type
- Plan
- Amount paid
- Currency
- Stripe invoice ID
- Billing period
- Invoice task status
- Synesis invoice number

Required task detail view:

- Billing profile snapshot.
- Stripe customer ID.
- Stripe subscription ID.
- Stripe invoice ID.
- Stripe payment intent ID if available.
- Amount and currency.
- Billing period.
- Admin notes.
- Status transition controls.
- Synesis invoice number field.
- Audit metadata for creation, review, issuance, and failure.

Allowed admin actions:

- Mark `pending` as `issued`.
- Mark `pending` as `needs_review`.
- Mark `pending` as `failed`.
- Mark `needs_review` as `issued`.
- Mark `needs_review` as `not_required`.
- Add or update admin notes.
- Add Synesis invoice number.

Dashboard should make duplicate Stripe invoice tasks visually obvious and should prevent issuing the same Stripe invoice task twice.

---

# 12. User Billing / Settings Page Requirements

User billing/settings page should show:

- Current plan.
- Plan limits and current usage.
- Subscription status.
- Current billing period end.
- Scheduled cancellation status.
- Billing profile fields.
- Button to start checkout for Basic or Pro.
- Button to open Stripe Customer Portal for active paid subscribers.

User actions:

- Update billing profile.
- Upgrade from Free to Basic or Pro.
- Change paid plan through Stripe-hosted flow where possible.
- Open Customer Portal.
- View high-level payment/subscription status.

User page should not expose:

- Admin invoice task queue.
- Internal Synesis notes.
- Raw Stripe webhook payloads.
- Other users' billing data.

If local invoice issuance is pending, the user page may show a simple user-safe status such as "Invoice processing" only after legal/accounting wording is approved.

---

# 13. Invoice Task Statuses

Invoice task statuses:

- `pending`: Payment succeeded and an admin task exists for manual Synesis review/issuance.
- `issued`: Admin issued the local/legal invoice in Synesis and recorded the Synesis invoice number or issuance confirmation.
- `failed`: Admin attempted processing but could not issue the invoice due to missing data, Synesis error, or other operational problem.
- `needs_review`: Customer type, jurisdiction, VAT/tax data, or procurement context requires accountant/admin review before issuing.
- `not_required`: Admin/accountant determined no Synesis invoice task is required for this payment or case.

Status transition rules should be explicit and logged. Avoid silently changing status from `issued` back to another state.

---

# 14. How to Handle B2G EU as `needs_review`

EU B2G customers should be routed to review by default.

Recommended behavior:

- Store customer type as `eu_b2g_needs_review`.
- Allow checkout only if required minimum billing fields are present, unless product/legal decides to block self-serve checkout.
- After successful payment, create an `InvoiceTask` with status `needs_review`.
- Show the task prominently in the admin dashboard.
- Require admin/accountant review before marking it `issued` or `not_required`.

Reasoning:

- EU public-sector billing can involve special procurement, e-invoice, VAT, or reverse-charge requirements.
- These rules should not be hard-coded until verified by an accountant.
- Manual review protects both legal compliance and customer experience.

Open decision:

- Decide whether EU B2G should be allowed to self-serve checkout or should instead request manual sales/accounting contact before payment.

---

# 15. Security Requirements

- Verify Stripe webhook signatures using the raw request body.
- Never store card data.
- Never trust client-submitted subscription status.
- Never grant paid access based only on checkout success redirect.
- Restrict billing profile access to the owning user and admins.
- Restrict invoice task access to admins only.
- Validate billing profile input server-side with Zod or equivalent validation.
- Store only invoicing fields that are actually needed.
- Avoid logging full webhook payloads in application logs.
- Protect admin billing routes with explicit admin authorization.
- Use HTTPS in production.
- Keep Stripe secret keys and webhook secrets in environment variables only.
- Do not expose Stripe secret keys to client bundles.
- Treat billing snapshots and tax IDs as sensitive business data.

---

# 16. Stripe Webhook Idempotency

Stripe may send the same event more than once. Plan2Ponuda must process webhook events idempotently.

Recommended approach:

1. Verify the Stripe signature.
2. Parse the event.
3. Start a database transaction.
4. Insert a `BillingEvent` with unique `stripeEventId`.
5. If insert fails because the event already exists, stop processing and return success.
6. Apply the subscription/payment update.
7. Create or update `InvoiceTask` using unique Stripe invoice identifiers.
8. Mark `BillingEvent.processedAt`.
9. Commit the transaction.

Additional rules:

- Return 2xx for duplicate already-processed events.
- Store processing errors on `BillingEvent.processingError`.
- Do not create invoice tasks from events that are not payment/invoice success events.
- Use unique constraints such as `stripeEventId` and `stripeInvoiceId` to prevent duplicate local records.
- Webhook handlers must tolerate out-of-order Stripe events by fetching the latest Stripe object if necessary.

---

# 17. Feature Gating Rules

Feature gates should be checked server-side in service functions before creating resources or running paid operations.

Recommended effective plan logic:

- Active paid subscription with `status` in `active` or `trialing`: use paid plan limits.
- `past_due`: allow a short grace policy only if explicitly chosen; otherwise restrict paid-only actions.
- `canceled` with `currentPeriodEnd` in the future and `cancelAtPeriodEnd = true`: allow paid access until period end.
- Missing subscription or inactive subscription: use Free limits.

Resource limits:

- Floor plan creation/upload must check `floor_plans_created`.
- Quote generation must check `quotes_created`.
- Large PDF analysis must check `large_pdf_analyses_used`.

Free plan:

- Allow up to 1 floor plan and 1 quote.
- Do not allow large project PDF analyses.

Basic plan:

- Allow up to 10 floor plans and 10 quotes per billing period.
- Do not allow large project PDF analyses.

Pro plan:

- Allow up to 20 floor plans and 20 quotes per billing period.
- Allow 2-3 large project PDF analyses per billing period, with exact limit decided before implementation.

Feature gating should fail closed. If subscription state is missing, inconsistent, or stale, use Free limits until webhook reconciliation succeeds.

---

# 18. Implementation Phases

## Phase 1: Billing Foundations

- Add billing enums and Prisma models.
- Add billing profile CRUD.
- Add server-side plan limit helpers.
- Add usage counter read/increment helpers.
- Add admin role/authorization prerequisite if not already present.

## Phase 2: Stripe Subscription Integration

- Create Stripe products and prices.
- Add checkout session creation.
- Add Customer Portal session creation.
- Add webhook endpoint with signature verification.
- Persist `Subscription` from Stripe webhooks.
- Store idempotent `BillingEvent` records.

## Phase 3: Manual Invoice Task Queue

- Create `InvoiceTask` records from paid Stripe invoice/payment events.
- Snapshot billing profile data into each task.
- Build admin invoice task list and detail views.
- Add status transitions and Synesis invoice number tracking.

## Phase 4: User Billing Experience

- Add user billing/settings page.
- Show plan, usage, subscription state, and billing profile.
- Add upgrade/manage subscription flows.
- Show cancellation-at-period-end state.

## Phase 5: Legal/Accounting Hardening

- Review customer type handling with accountant.
- Confirm VAT/OIB requirements.
- Confirm invoice status wording.
- Decide B2G self-serve vs manual-sales flow.
- Add operational reports for accountant reconciliation.

---

# 19. Testing Checklist

Model and validation tests:

- Billing profile validation accepts required fields for each customer type.
- Billing profile validation rejects missing required fields.
- EU B2G customer type maps to review workflow.
- Usage limits are enforced for Free, Basic, and Pro.
- Usage counters reset or scope correctly by billing period.

Stripe webhook tests:

- Reject invalid webhook signatures.
- Process `checkout.session.completed`.
- Process `customer.subscription.created`.
- Process `customer.subscription.updated`.
- Process `customer.subscription.deleted`.
- Process `invoice.paid`.
- Process `invoice.payment_failed`.
- Ignore duplicate Stripe event IDs.
- Do not create duplicate invoice tasks for the same Stripe invoice ID.
- Handle out-of-order subscription events safely.

Subscription lifecycle tests:

- Free user has Free limits.
- Basic active subscription has Basic limits.
- Pro active subscription has Pro limits.
- Canceled-at-period-end subscription keeps access until period end.
- Expired canceled subscription falls back to Free limits.
- Past-due subscription follows the chosen grace policy.

Admin dashboard tests:

- Admin can list invoice tasks.
- Admin can filter by status.
- Admin can mark pending task as issued.
- Admin can mark task as needs_review.
- Admin can record Synesis invoice number.
- Non-admin users cannot access invoice tasks.

User billing page tests:

- User can view own billing profile.
- User cannot view another user's billing profile.
- User sees current plan and usage.
- User can start checkout for paid plan.
- User can open Customer Portal when Stripe customer exists.

Manual reconciliation tests:

- Paid Stripe invoice creates invoice task when required.
- Invoice task includes billing snapshot.
- `not_required` status can be applied only by admin.
- `issued` task keeps Synesis invoice number and issued timestamp.

---

# 20. Open Legal / Accounting Questions to Verify With Accountant

- Is Stripe's own invoice/receipt ever sufficient for any Plan2Ponuda customer type?
- For Croatian individuals, is OIB required on invoices?
- For Croatian businesses, exactly which fields are required for a valid invoice?
- How should Croatian B2G customers be invoiced, including e-racun requirements?
- Should Croatian B2G be allowed to self-serve checkout?
- How should EU business VAT IDs be validated and stored?
- What reverse-charge wording is required for EU business invoices?
- How should EU B2G customers be handled, and should they always be manual review?
- Should EU B2G customers be blocked from automatic Stripe checkout until review?
- How should outside-EU customers be classified for VAT/tax purposes?
- Which customer types require Synesis invoice issuance after every Stripe payment?
- Which customer types, if any, can be marked `not_required` automatically?
- What invoice numbering and reference fields must be copied from Stripe into Synesis?
- What payment date, invoice date, and service period should be used for monthly subscriptions?
- How should refunds, chargebacks, or credits be represented in Synesis?
- What records must be retained for audit purposes and for how long?
- What user-facing invoice status wording is legally safe?
- Are Pro large PDF analyses part of subscription entitlement, add-ons, or metered usage?
- What exact Pro price and large PDF analysis limit should be used?
