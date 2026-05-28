import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "hr", "sr", "de", "sl"];
const detectedSystemKeys = [
  "power_distribution",
  "lighting",
  "sockets",
  "switches",
  "distribution_board",
  "low_voltage",
  "network",
  "fire_alarm",
  "grounding",
  "lightning_protection",
  "hvac_connections",
  "other",
];

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMessages(locale) {
  return JSON.parse(readSource(`messages/${locale}.json`));
}

test("detected system labels exist in every locale and Serbian remains Latin", () => {
  const cyrillicPattern = /[\u0400-\u04FF]/;

  for (const locale of locales) {
    const messages = readMessages(locale);
    const labels = messages.ProjectDocumentSystems;

    assert.deepEqual(
      Object.keys(labels).sort(),
      [...detectedSystemKeys].sort(),
      `${locale} ProjectDocumentSystems key mismatch`,
    );

    for (const key of detectedSystemKeys) {
      assert.equal(typeof labels[key], "string", `${locale}.${key} missing`);
      assert.ok(labels[key].length > 0, `${locale}.${key} is empty`);
    }
  }

  assert.doesNotMatch(
    JSON.stringify(readMessages("sr").ProjectDocumentSystems),
    cyrillicPattern,
  );
});

test("analysis summary renders detected systems through localized labels", () => {
  const source = readSource(
    "src/components/projects/project-documentation-analysis-card.tsx",
  );

  assert.match(source, /useTranslations\("ProjectDocumentSystems"\)/);
  assert.match(source, /getDetectedSystemLabel/);
  assert.match(source, /formatDetectedSystemFallback/);
  assert.doesNotMatch(source, /system\.replace\(\S*\/_\//);
});

test("detected system enum values remain internal schema values", () => {
  const schemaSource = readSource(
    "src/lib/validations/project-document-analysis.schema.ts",
  );

  for (const key of detectedSystemKeys) {
    assert.match(schemaSource, new RegExp(`"${key}"`));
  }

  assert.doesNotMatch(schemaSource, /Elektroenergetska/);
  assert.doesNotMatch(schemaSource, /Beleuchtung/);
  assert.doesNotMatch(schemaSource, /Razsvetljava/);
});
