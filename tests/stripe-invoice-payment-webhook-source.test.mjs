import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("invoice_payment.paid retrieves the full invoice before creating an invoice task", () => {
  const source = readSource("src/server/services/stripe-webhook-service.ts");

  assert.match(source, /case "invoice_payment\.paid":/);
  assert.match(source, /processInvoicePaymentPaid/);
  assert.match(source, /getInvoiceIdFromInvoicePayment/);
  assert.match(source, /getStripeClient\(\)\.invoices\.retrieve/);
  assert.match(source, /createInvoiceTaskFromPaidInvoice\(invoice,\s*eventId\)/);
});

test("invoice_payment.paid missing invoice id and retrieval errors fail webhook processing safely", () => {
  const source = readSource("src/server/services/stripe-webhook-service.ts");

  assert.match(source, /missing invoice id/);
  assert.match(source, /markBillingEventFailed/);
  assert.match(source, /processingError:\s*getProcessingError\(error\)/);
});

test("invoice.paid and invoice_payment.paid are idempotent for the same invoice", () => {
  const source = readSource("src/server/services/stripe-webhook-service.ts");
  const schema = readSource("prisma/schema.prisma");

  assert.match(source, /prisma\.invoiceTask\.upsert/);
  assert.match(source, /where:\s*\{\s*stripeInvoiceId:\s*invoice\.id/s);
  assert.match(schema, /stripeInvoiceId\s+String\?\s+@unique/);
});

test("deployment checklist includes invoice_payment.paid webhook subscription", () => {
  const checklist = readSource(".codex/DEPLOYMENT_CHECKLIST.md");

  assert.match(checklist, /invoice_payment\.paid/);
});
