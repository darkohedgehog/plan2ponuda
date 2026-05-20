import assert from "node:assert/strict";
import test from "node:test";

import {
  getInvoiceTaskSnapshotFields,
  shouldShowEuB2gReviewNotice,
} from "../src/lib/billing/invoice-task-snapshot-fields.ts";

const baseProfile = {
  billingAddressLine1: "Ilica 1",
  billingAddressLine2: null,
  billingCity: "Zagreb",
  billingCountry: "HR",
  billingEmail: "billing@example.com",
  billingName: "Example Customer",
  billingPostalCode: "10000",
  companyName: null,
  contactPerson: null,
  customerType: "croatian_individual",
  eInvoiceReference: null,
  notes: null,
  oib: null,
  phone: null,
  procurementReference: null,
  purchaseOrderNumber: null,
  taxId: null,
  vatId: null,
};

test("uses OIB as the important Croatian B2B identifier", () => {
  const fields = getInvoiceTaskSnapshotFields({
    ...baseProfile,
    billingName: "Elektro Primjer d.o.o.",
    companyName: "Elektro Primjer d.o.o.",
    customerType: "croatian_business_b2b",
    oib: "12345678901",
    vatId: "HR12345678901",
  });
  const oibField = fields.find((field) => field.key === "oib");
  const vatField = fields.find((field) => field.key === "vatId");

  assert.equal(oibField?.value, "12345678901");
  assert.equal(oibField?.isImportant, true);
  assert.equal(oibField?.isMissing, false);
  assert.equal(vatField?.value, "HR12345678901");
  assert.equal(vatField?.isImportant, false);
});

test("marks missing Croatian B2G OIB for old snapshots", () => {
  const fields = getInvoiceTaskSnapshotFields({
    ...baseProfile,
    billingName: "City Office",
    companyName: "City Office",
    customerType: "croatian_b2g",
  });
  const oibField = fields.find((field) => field.key === "oib");

  assert.equal(oibField?.value, null);
  assert.equal(oibField?.isImportant, true);
  assert.equal(oibField?.isMissing, true);
});

test("uses VAT ID as the important EU business identifier", () => {
  const fields = getInvoiceTaskSnapshotFields({
    ...baseProfile,
    billingCountry: "DE",
    billingName: "EU Example GmbH",
    companyName: "EU Example GmbH",
    customerType: "eu_business",
    vatId: "DE123456789",
  });
  const vatField = fields.find((field) => field.key === "vatId");

  assert.equal(vatField?.value, "DE123456789");
  assert.equal(vatField?.isImportant, true);
  assert.equal(vatField?.isMissing, false);
});

test("does not show tax identifiers for Croatian individuals", () => {
  const fields = getInvoiceTaskSnapshotFields({
    ...baseProfile,
    oib: "12345678901",
    vatId: "HR12345678901",
  });
  const taxFieldKeys = fields
    .filter((field) =>
      ["oib", "taxId", "vatId"].includes(field.key),
    )
    .map((field) => field.key);

  assert.deepEqual(taxFieldKeys, []);
});

test("keeps public-sector references visible for B2G review", () => {
  const fields = getInvoiceTaskSnapshotFields({
    ...baseProfile,
    billingCountry: "SI",
    billingName: "EU Public Office",
    companyName: "EU Public Office",
    customerType: "eu_b2g_needs_review",
    eInvoiceReference: "E-REF-1",
    procurementReference: "PROC-7",
    purchaseOrderNumber: "PO-42",
    vatId: "SI12345678",
  });

  assert.equal(shouldShowEuB2gReviewNotice("eu_b2g_needs_review"), true);
  assert.equal(
    fields.find((field) => field.key === "purchaseOrderNumber")?.value,
    "PO-42",
  );
  assert.equal(
    fields.find((field) => field.key === "eInvoiceReference")?.value,
    "E-REF-1",
  );
  assert.equal(
    fields.find((field) => field.key === "procurementReference")?.value,
    "PROC-7",
  );
});
