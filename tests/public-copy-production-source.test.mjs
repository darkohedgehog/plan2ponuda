import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "hr", "sr", "de", "sl"];
const publicNamespaces = [
  "Complaints",
  "Contact",
  "Cookies",
  "Legal",
  "Marketing",
  "Pricing",
  "Privacy",
  "Terms",
];
const forbiddenProductionCopy = [
  /\bbeta\b/i,
  /TODO/i,
  /Synesis/i,
  /before production/i,
  /production launch/i,
  /pre-production/i,
  /produkcij/i,
  /produkc/i,
  /release-prep/i,
  /legal[- ]review/i,
  /lawyer/i,
  /accountant/i,
  /odvjetnik/i,
  /računovođ/i,
  /advokat/i,
  /pravni pregled/i,
  /pravno pregled/i,
  /pravnik/i,
  /placeholder/i,
];

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMessages(locale) {
  return JSON.parse(readSource(`messages/${locale}.json`));
}

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, output);
    }

    return output;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, output);
    }
  }

  return output;
}

test("public marketing and legal copy has no pre-production wording", () => {
  for (const locale of locales) {
    const messages = readMessages(locale);

    for (const namespace of publicNamespaces) {
      const strings = collectStrings(messages[namespace]);

      for (const text of strings) {
        for (const pattern of forbiddenProductionCopy) {
          assert.doesNotMatch(text, pattern, `${locale}.${namespace}: ${text}`);
        }
      }
    }
  }
});

test("legal page component does not render the old draft notice block", () => {
  const source = readSource("src/components/marketing/legal-page-content.tsx");

  assert.doesNotMatch(source, /draftNoticeTitle/);
  assert.doesNotMatch(source, /draftNoticeDescription/);
});
