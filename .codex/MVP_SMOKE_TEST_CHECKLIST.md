# MVP Smoke Test Checklist

Run this manual browser checklist before every major Plan2Ponuda release. Use a
staging or local environment with test credentials only. Do not paste real
secrets, live card data, or production customer data into this file or test
notes.

Record for each run:

- Release/version:
- Environment URL:
- Browser/device:
- Tester:
- Date:

## 1. Environment Setup

- [ ] Start from a clean browser profile, private window, or cleared session.
- [ ] Confirm the target environment is not production unless this is an
  approved production smoke test.
- [ ] Confirm required environment variables are configured for database,
  Supabase Storage, NextAuth, SMTP, OpenAI, Stripe, and app URL.
- [ ] Confirm Stripe is in test mode for local/staging tests.
- [ ] Confirm SMTP points to a test inbox or mailbox safe for smoke testing.
- [ ] Confirm the private Supabase Storage bucket is available for floor plan
  uploads.
- [ ] Confirm the app loads at the localized home route, for example `/hr`.
- [ ] Confirm unauthenticated dashboard routes redirect to sign-in.
- [ ] Keep browser devtools Network and Console available during the test.

## 2. Test Users Needed

- [ ] Free user: new or reset account with `free` plan and no active
  subscription.
- [ ] Basic user: account that can complete Basic checkout or already has an
  active Basic test subscription.
- [ ] Pro user: account that can complete Pro checkout or already has an
  active Pro test subscription.
- [ ] Admin user: account with admin role and access to
  `/hr/dashboard/admin/billing`.
- [ ] Record each test user's email, plan, and starting usage counts in the
  test run notes.
- [ ] Verify each user has a unique email and cannot see another user's
  projects.

## 3. Required Test Data

- [ ] Sample floor plan image: valid JPG, JPEG, PNG, or PDF with several rooms
  and readable labels.
- [ ] Stripe test card: `4242 4242 4242 4242`, any future expiry date, any CVC,
  and any postal code.
- [ ] SMTP test email inbox: accessible mailbox or capture tool where reset
  emails can be opened.
- [ ] Billing profile data for at least one Croatian individual and one
  business/B2G-style customer, including required billing fields.
- [ ] Sample project documentation PDF under 20 MB with readable material and
  labor references.
- [ ] Oversized project documentation PDF over 20 MB for upload validation.
- [ ] Optional invalid upload file for negative checks, such as a `.txt` file.

## 4. Auth Flow Tests

- [ ] Visit `/hr/dashboard` while signed out and confirm redirect to
  `/hr/sign-in`.
- [ ] Open `/hr/sign-up` and create the Free test user with valid credentials.
- [ ] Confirm validation messages appear for invalid email, weak/mismatched
  password, and missing required fields.
- [ ] Confirm duplicate sign-up for the same email is rejected cleanly.
- [ ] Sign out and sign in again from `/hr/sign-in`.
- [ ] Confirm invalid sign-in credentials show a safe error and do not create a
  session.
- [ ] Confirm authenticated users can access `/hr/dashboard`, projects,
  materials, quotes, billing, and settings pages.
- [ ] Confirm signed-in users can sign out and protected pages are blocked
  again.

## 5. Password Reset Tests

- [ ] Open `/hr/forgot-password`.
- [ ] Submit the Free user's email and confirm the UI shows a neutral success
  response.
- [ ] Submit an unknown email and confirm the UI shows the same neutral style of
  response.
- [ ] Open the SMTP test inbox and confirm exactly one reset email arrives for
  the known account.
- [ ] Open the reset link and set a new password.
- [ ] Confirm sign-in works with the new password and fails with the old
  password.
- [ ] Reopen the same reset link and confirm token reuse is rejected.
- [ ] Open `/hr/reset-password` without a token or with a malformed token and
  confirm a safe error state.

## 6. Free Plan Usage Limit Tests

- [ ] Sign in as the Free user and confirm billing/usage displays the Free
  plan.
- [ ] Create one project from `/hr/dashboard/projects/new`.
- [ ] Upload the sample floor plan and confirm the first upload succeeds.
- [ ] Generate or create one quote for the project and confirm the first quote
  succeeds.
- [ ] Attempt to create or upload a second floor plan after the Free limit is
  reached and confirm the app blocks the action with an upgrade path.
- [ ] Attempt to create a second quote after the Free limit is reached and
  confirm the app blocks the action with an upgrade path.
- [ ] Replace or re-upload the source file for an existing project, if
  supported, and confirm usage is not double-counted for the same project.
- [ ] Confirm blocked limit responses do not create partial projects, uploads,
  rooms, quotes, or usage counter drift.

## 7. Basic Plan Stripe Checkout/Webhook Tests

- [ ] Sign in as the Basic test user while on Free, or use a fresh Free account
  intended for Basic checkout.
- [ ] Open `/hr/dashboard/billing`.
- [ ] Attempt Basic checkout with an incomplete billing profile and confirm the
  app asks for required billing details.
- [ ] Save a complete billing profile.
- [ ] Start Basic checkout and confirm Stripe Checkout opens with the expected
  Basic test price.
- [ ] Pay with the Stripe test card.
- [ ] Confirm the app returns to the billing success or dashboard flow without
  console errors.
- [ ] Confirm the Stripe webhook updates the subscription to Basic/active.
- [ ] Confirm Basic usage limits are shown as 10 floor plans and 10 quotes.
- [ ] Confirm Pro-only large PDF/documentation analysis remains unavailable on
  Basic.
- [ ] Confirm a paid invoice creates or updates the expected admin invoice task
  when the customer type requires manual invoice review.
- [ ] Confirm the billing portal opens for the Basic user after subscription
  creation.

## 8. Pro Plan Gating Tests

- [ ] Sign in as a Free user and confirm the project documentation analysis card
  is locked or prompts upgrade.
- [ ] Sign in as a Basic user and confirm the same documentation analysis
  feature remains locked.
- [ ] Sign in as a Pro user and confirm the documentation analysis area changes
  from locked to the upload and analysis workflow.
- [ ] Confirm Pro usage limits show 20 floor plans, 20 quotes, and 3 large PDF
  analyses.
- [ ] Confirm direct navigation or API attempts by non-Pro users do not bypass
  the gate.

## 9. Pro Project Documentation Analysis Tests

- [ ] Free/Basic locked Pro card: sign in as a Free user and a Basic user,
  open a project detail page, and confirm the project documentation analysis
  card is locked, has an upgrade path, and cannot upload or analyze documents.
- [ ] Pro PDF upload: sign in as a Pro user, open a project detail page, upload
  the sample project documentation PDF, and confirm the document appears after
  refresh.
- [ ] PDF validation: attempt to upload a non-PDF file and confirm it is
  rejected with a safe validation message.
- [ ] PDF validation: attempt to upload the oversized PDF and confirm the
  20 MB limit is enforced without creating a document row.
- [ ] Pro AI document analysis success: run analysis on the uploaded PDF,
  confirm loading state prevents duplicate clicks, and confirm the completed
  analysis shows summary counts and extracted material/labor candidates.
- [ ] Failed analysis behavior: simulate or use a known failing document/provider
  condition and confirm the UI shows a recoverable failure without creating
  candidates, importing materials, changing quote totals, or exposing provider
  details.
- [ ] Usage counting: record `large_pdf_analyses_used` before analysis, confirm
  it increments only after successful completed analysis, and confirm failed
  analysis does not increment it.
- [ ] Existing completed analysis: refresh the page and reopen the document,
  confirm the completed analysis is reused, does not re-run AI, and does not
  double-count `large_pdf_analyses_used`.
- [ ] Candidate review: edit a material candidate name, category, unit,
  quantity, unit price, and notes.
- [ ] Candidate review: mark one candidate accepted, mark one candidate
  rejected, leave one candidate pending where available, and save review.
- [ ] Candidate review: refresh the page and confirm edited fields and
  pending/accepted/rejected statuses persist.
- [ ] Import accepted items: click "Import accepted items to quote" and confirm
  only accepted material candidates are imported.
- [ ] Import accepted items: confirm pending and rejected candidates do not
  create quote material rows.
- [ ] Import accepted items: run import again and confirm imported materials are
  not duplicated.
- [ ] Import accepted items: confirm accepted labor candidates remain reviewed
  but are not imported into quote totals.
- [ ] Quote page: open the project quote page and confirm imported materials
  appear as project-local material rows.
- [ ] Quote page: confirm imported rows show a source label meaning "From
  project document" or equivalent localized text.
- [ ] Quote page: when source metadata is available, confirm the imported row
  shows document name, source reference, and confidence.
- [ ] PDF export: export the quote PDF and confirm imported document materials
  appear naturally in the material list and totals match the on-screen quote.
- [ ] Excel export: export the quote workbook and confirm imported document
  materials appear naturally in the materials sheet and totals match the
  on-screen quote.
- [ ] Multi-tenant security: sign in as another user and confirm they cannot
  access the document upload/list, document analysis, candidate review, or
  import API routes for the Pro user's project/document/analysis IDs.
- [ ] Delete project cleanup: delete a disposable project with uploaded project
  documentation and confirm direct access to the project, document routes, and
  uploaded document assets is no longer available.
- [ ] Responsive check: review the document analysis card and candidate review
  UI on mobile, tablet, and desktop widths; confirm inputs, status controls,
  import summary, source metadata, and action buttons do not overflow or
  overlap.
- [ ] Current labor module TODO: confirm labor candidates are visible for
  review but not imported, not included in quote totals, and clearly labeled as
  future labor-module work.

## 10. Project Workflow Tests

- [ ] Sign in as a user with available floor plan quota.
- [ ] Open `/hr/dashboard/projects` and confirm empty, loading, and populated
  states look correct for the account.
- [ ] Create a new project with valid name, client name, object type, and area.
- [ ] Confirm invalid project form data is rejected with clear validation
  errors.
- [ ] Confirm the created project appears in the projects list and dashboard
  overview.
- [ ] Open the project detail page and confirm source file preview, status,
  upload CTA, analysis CTA/state, room review CTA, and quote CTA are present as
  appropriate.
- [ ] Upload the sample floor plan.
- [ ] Refresh the page and confirm project metadata and upload state persist.
- [ ] Open another user's project URL while signed in and confirm access is
  denied or returns not found.

## 11. AI Analysis Tests

- [ ] Use a project with a valid uploaded floor plan.
- [ ] Start AI analysis from the project detail page.
- [ ] Confirm the button/loading state prevents duplicate submissions.
- [ ] Confirm the analysis completes and stores room suggestions.
- [ ] Confirm validation failures or provider errors show a recoverable error
  state and do not corrupt existing project data.
- [ ] Confirm generated rooms are presented as suggestions requiring user
  review, not final electrical design.
- [ ] Refresh the project and confirm the analysis status and generated data
  persist.
- [ ] Confirm repeated analysis attempts remain within usage/rate-limit
  behavior and show safe errors when blocked.

## 12. Room Review/Material/Quote Tests

- [ ] Open `/hr/dashboard/projects/{projectId}/review`.
- [ ] Confirm analyzed rooms are listed with editable names, types, dimensions,
  and relevant room data.
- [ ] Edit a room and save changes.
- [ ] Add, update, and remove a room where the UI supports it.
- [ ] Confirm invalid room values are rejected without losing previous saved
  data.
- [ ] Open `/hr/dashboard/materials` and confirm the material catalog loads.
- [ ] Edit a material price and confirm the change persists after refresh.
- [ ] Open `/hr/dashboard/projects/{projectId}/quote`.
- [ ] Generate or refresh project materials from reviewed rooms.
- [ ] Adjust material quantities/prices and confirm totals update predictably.
- [ ] Confirm quote summary totals, VAT/tax assumptions, and line items are
  internally consistent.
- [ ] Confirm `/hr/dashboard/quotes` lists the project quote.

## 13. PDF Export Tests

- [ ] Use a reviewed project with a generated quote.
- [ ] Click the PDF export action.
- [ ] Confirm the browser downloads or opens a PDF without server errors.
- [ ] Open the PDF and confirm project name, client, rooms, materials, totals,
  and quote metadata are present.
- [ ] Confirm special Croatian/European characters render correctly.
- [ ] Confirm exported amounts match the on-screen quote.
- [ ] Confirm another user cannot export the PDF by guessing the project ID.

## 14. Excel Export Tests

- [ ] Use the same reviewed project with a generated quote.
- [ ] Click the Excel export action.
- [ ] Confirm the browser downloads an `.xlsx` file without server errors.
- [ ] Open the workbook and confirm sheets, headers, materials, quantities,
  unit prices, totals, and quote metadata are present.
- [ ] Confirm formulas or calculated values match the on-screen quote.
- [ ] Confirm special Croatian/European characters render correctly.
- [ ] Confirm another user cannot export the Excel file by guessing the project
  ID.

## 15. Delete Project Tests

- [ ] Create a disposable project for deletion.
- [ ] Confirm the delete action is clearly separated from normal project
  editing.
- [ ] Attempt deletion and cancel at the confirmation step; confirm the project
  remains.
- [ ] Confirm deletion with the required confirmation input or action.
- [ ] Confirm the project disappears from the dashboard, projects list, quotes
  list, and direct URL access.
- [ ] Confirm uploaded project documentation PDFs and related document records
  are cleaned up or are no longer accessible after project deletion.
- [ ] Confirm deleting one project does not affect another project for the same
  user.
- [ ] Confirm another user cannot delete the project by guessing the project ID.

## 16. Admin Invoice Queue Tests

- [ ] Sign in as a non-admin user and confirm
  `/hr/dashboard/admin/billing` is blocked.
- [ ] Sign in as the Admin user and open `/hr/dashboard/admin/billing`.
- [ ] Confirm invoice task summary counts load for pending, needs review,
  issued, and failed statuses.
- [ ] Confirm filters by status and customer type work.
- [ ] Open or expand an invoice task and review customer type, billing snapshot,
  missing fields, amount, currency, Stripe invoice ID, payment intent ID,
  subscription ID, and billing period.
- [ ] Save admin notes and confirm they persist after refresh.
- [ ] Attempt to mark a task as issued without a Synesis invoice number and
  confirm validation blocks the action.
- [ ] Enter a Synesis invoice number and mark the task issued.
- [ ] Confirm issued tasks cannot be edited in a way that violates the locked
  issued state.
- [ ] Mark a separate task as needs review, failed, or not required where
  appropriate and confirm status updates persist.

## 17. Multi-Tenant Security Tests

- [ ] User A creates a project with upload, rooms, materials, quote, PDF, and
  Excel export.
- [ ] User B signs in and confirms User A's project does not appear in any list.
- [ ] User B directly opens User A's project, review, quote, PDF export, and
  Excel export URLs and confirms access is denied or returns not found.
- [ ] User B directly calls User A's project document, document analysis,
  candidate review, and candidate import routes and confirms access is denied
  or returns not found.
- [ ] User B attempts update/delete actions against User A's project ID and
  confirms the app rejects them.
- [ ] Confirm API failures do not leak User A project names, client names,
  storage paths, signed URLs, quote data, or billing data to User B.
- [ ] Confirm non-admin users cannot access admin invoice queue data.
- [ ] Confirm browser source, network responses, and console logs do not expose
  provider secrets or server-only keys.

## 18. Responsive Layout Checks

- [ ] Check marketing home, pricing, sign-in, sign-up, and forgot-password pages
  on mobile, tablet, and desktop widths.
- [ ] Check dashboard overview, projects list, project detail, review, quote,
  materials, billing, settings, and admin billing on mobile, tablet, and
  desktop widths.
- [ ] Confirm navigation, locale switcher, forms, tables, upload controls,
  quote editors, and admin invoice table remain usable.
- [ ] Confirm project documentation upload, analysis, candidate review, and
  import summary controls remain usable on mobile, tablet, and desktop widths.
- [ ] Confirm text does not overlap, overflow buttons, or become unreadable at
  narrow widths.
- [ ] Confirm loading, empty, error, and success states remain visible and
  accessible on small screens.

## 19. i18n Locale Checks

- [ ] Confirm locale routes load for `/hr`, `/sr`, `/en`, `/de`, and `/sl`.
- [ ] Confirm locale switcher changes the route prefix and preserves the
  current page where expected.
- [ ] Confirm auth, dashboard, project, quote, billing, and admin labels are
  translated or have acceptable fallback text in each locale.
- [ ] Confirm date, time, number, and currency formatting look correct for the
  selected locale.
- [ ] Confirm validation and error messages are localized or have acceptable
  fallback text.
- [ ] Confirm unsupported locale routes redirect or resolve safely to the
  default locale.

## 20. Expected Pass/Fail Criteria

- [ ] Pass: all critical user journeys work for Free, Basic, Pro, and Admin
  users without unhandled errors.
- [ ] Pass: auth, password reset, project ownership, exports, billing, and admin
  routes enforce authorization.
- [ ] Pass: Stripe test checkout and webhook update subscription state and
  invoice queue data as expected.
- [ ] Pass: AI analysis either succeeds with valid saved data or fails in a
  recoverable, user-safe way.
- [ ] Pass: Pro project documentation analysis creates reviewable candidates,
  imports only accepted material candidates after explicit user action, and
  keeps pending/rejected/labor candidates out of quote totals.
- [ ] Pass: imported document materials are traceable in the quote UI and
  exports through source labels and available document/source metadata.
- [ ] Pass: PDF and Excel exports open and match on-screen quote totals.
- [ ] Pass: no provider secrets, signed storage paths, or cross-tenant data leak
  in the browser.
- [ ] Fail release: sign-up/sign-in/password reset is broken.
- [ ] Fail release: users can access or mutate another user's project, quote,
  export, billing profile, or admin data.
- [ ] Fail release: Stripe checkout/webhook cannot create the expected active
  subscription in test mode.
- [ ] Fail release: usage limits can be bypassed or block allowed usage
  incorrectly.
- [ ] Fail release: failed or repeated document analysis consumes extra large
  PDF analysis usage.
- [ ] Fail release: pending, rejected, or labor document candidates are imported
  into quote totals.
- [ ] Fail release: repeated document candidate import creates duplicate quote
  material rows.
- [ ] Fail release: quote generation or exports produce materially wrong totals.
- [ ] Fail release: build, typecheck, or lint fails unless the failure is
  explicitly accepted and tracked before release.

## 21. Known Manual Checks That Cannot Be Automated Yet

- [ ] Visual review of generated AI room suggestions against the uploaded floor
  plan.
- [ ] Manual judgment that generated material lists are plausible for the room
  review and proposal context.
- [ ] Manual judgment that project documentation material and labor candidates
  are plausible for the uploaded PDF.
- [ ] Labor module TODO: labor candidates are intentionally review-only and
  must not affect quote totals until a dedicated labor import workflow exists.
- [ ] Manual PDF layout review for branding, pagination, typography, and
  special characters.
- [ ] Manual Excel workbook review in the target spreadsheet app.
- [ ] Manual Stripe Dashboard verification of test events, invoices,
  subscriptions, customer IDs, and webhook delivery logs.
- [ ] Manual SMTP inbox verification for email content, sender name, and reset
  link behavior.
- [ ] Manual Synesis/legal invoice workflow reconciliation outside the app.
- [ ] Manual responsive inspection for real devices and browser-specific layout
  issues.
- [ ] Manual translation quality review by a native speaker for each supported
  locale.
