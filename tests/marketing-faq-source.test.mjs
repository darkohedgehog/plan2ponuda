import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "hr", "sr", "de", "sl"];
const faqItemKeys = [
  "whatIs",
  "aiReview",
  "free",
  "basic",
  "pro",
  "cancel",
  "payments",
  "invoices",
  "refund",
  "storage",
  "projectPdf",
  "contact",
];

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMessages(locale) {
  return JSON.parse(readSource(`messages/${locale}.json`));
}

function flattenKeys(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.keys(value).flatMap((key) =>
    flattenKeys(value[key], prefix ? `${prefix}.${key}` : key),
  );
}

test("marketing homepage includes FAQ before the final CTA", () => {
  const homepage = readSource("src/components/marketing/marketing-homepage.tsx");

  assert.match(homepage, /import \{ FaqSection \}/);
  assert.match(homepage, /<FaqSection \/>/);
  assert.ok(
    homepage.indexOf("<PlanCtaSection") < homepage.indexOf("<FaqSection"),
    "FAQ should follow plan CTA",
  );
  assert.ok(
    homepage.indexOf("<FaqSection") < homepage.indexOf("<CtaSection"),
    "FAQ should appear before final CTA",
  );
});

test("marketing FAQ section is public-only, lightweight, linked, and legal cautious", () => {
  const source = readSource("src/components/marketing/faq-section.tsx");

  assert.match(source, /useTranslations\("Marketing\.faq"\)/);
  assert.match(source, /href: "\/pricing"/);
  assert.match(source, /href: "\/contact"/);
  assert.match(source, /href: "\/complaints"/);
  assert.match(source, /href: "\/terms"/);
  assert.match(source, /TODO\(legal\)/);
  assert.doesNotMatch(source, /"use client"/);
  assert.doesNotMatch(source, /stripe/i);
  assert.doesNotMatch(source, /prisma/i);
});

test("marketing FAQ translations exist with matching locale keys and required content", () => {
  const referenceKeys = flattenKeys(readMessages("en").Marketing.faq).sort();

  for (const locale of locales) {
    const faq = readMessages(locale).Marketing.faq;
    const keys = flattenKeys(faq).sort();

    assert.deepEqual(keys, referenceKeys, `${locale} FAQ key mismatch`);
    assert.equal(typeof faq.eyebrow, "string");
    assert.equal(typeof faq.title, "string");
    assert.equal(typeof faq.titleAccent, "string");
    assert.equal(typeof faq.description, "string");

    for (const key of faqItemKeys) {
      assert.equal(typeof faq.items[key].question, "string");
      assert.equal(typeof faq.items[key].answer, "string");
      assert.ok(faq.items[key].question.length > 0);
      assert.ok(faq.items[key].answer.length > 0);
    }
  }

  assert.doesNotMatch(
    readMessages("en").Marketing.faq.items.refund.answer,
    /must be reviewed by lawyer\/accountant before production/i,
  );
  assert.match(readMessages("en").Marketing.faq.items.payments.answer, /Stripe/);
  assert.doesNotMatch(
    readMessages("en").Marketing.faq.items.invoices.answer,
    /Synesis/,
  );
  assert.doesNotMatch(readMessages("en").Marketing.faq.description, /beta/i);
  assert.doesNotMatch(
    JSON.stringify(readMessages("sr").Marketing.faq),
    /[\u0400-\u04ff]/,
  );
});
