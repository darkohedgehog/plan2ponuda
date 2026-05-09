import assert from "node:assert/strict";
import test from "node:test";

import {
  getCompanyDetailRows,
  type QuotePdfCompanyLabels,
} from "../src/lib/pdf/generate-quote";

const labels: QuotePdfCompanyLabels = {
  address: "Address",
  city: "City",
  country: "Country",
  email: "Email",
  fullName: "Full name",
  name: "Company",
  phone: "Phone",
  taxId: "OIB / VAT number",
};

test("returns only provider fields that have values", () => {
  assert.deepEqual(
    getCompanyDetailRows(
      {
        companyAddress: "Main street 1",
        companyCity: undefined,
        companyCountry: "Croatia",
        companyEmail: "",
        companyName: "Elektro Test",
        companyPhone: undefined,
        companyTaxId: "HR123",
        fullName: "Ana Anića",
      },
      labels,
    ),
    [
      ["Full name", "Ana Anića"],
      ["Company", "Elektro Test"],
      ["Address", "Main street 1"],
      ["Country", "Croatia"],
      ["OIB / VAT number", "HR123"],
    ],
  );
});
