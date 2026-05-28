import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "hr", "sr", "de", "sl"];

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMessages(locale) {
  return JSON.parse(readSource(`messages/${locale}.json`));
}

function flattenKeys(value, prefix = "") {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.keys(value).flatMap((key) =>
    flattenKeys(value[key], prefix ? `${prefix}.${key}` : key),
  );
}

test("analyze button and route pass a validated locale into document analysis", () => {
  const formSource = readSource(
    "src/components/projects/project-document-upload-form.tsx",
  );
  const routeSource = readSource(
    "src/app/api/projects/[projectId]/documents/[documentId]/analyze/route.ts",
  );
  const serviceSource = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  assert.match(formSource, /useLocale/);
  assert.match(formSource, /locale=\$\{encodeURIComponent\(locale\)\}/);
  assert.match(routeSource, /resolveProjectDocumentAnalysisLocale/);
  assert.match(routeSource, /request\.url/);
  assert.match(routeSource, /resolveLocale/);
  assert.match(serviceSource, /locale:\s*Locale/);
  assert.match(
    serviceSource,
    /const aiAnalysis = await runProjectDocumentAnalysis\(\{[\s\S]*locale,/,
  );
});

test("document analysis instructions localize user-facing text while preserving internal enums", () => {
  const source = readSource("src/lib/ai/document-analysis-service.ts");

  for (const locale of ["hr", "sr", "en", "de", "sl"]) {
    assert.match(source, new RegExp(`${locale}:`));
  }

  for (const languageName of [
    "Croatian",
    "Serbian Latin",
    "English",
    "German",
    "Slovenian",
  ]) {
    assert.match(source, new RegExp(languageName));
  }

  assert.match(source, /projectSummary/);
  assert.match(source, /name, description, notes/);
  assert.match(source, /assumptions, and missingInformation/);
  assert.match(source, /Keep schema enum values unchanged/);
  assert.match(source, /material categories, units, detectedSystems, candidate type\/status/);
});

test("completed document analysis is still reused before any new AI request", () => {
  const source = readSource(
    "src/server/services/project-document-analysis-service.ts",
  );

  const completedIndex = source.indexOf("completedAnalysis");
  const ensureIndex = source.indexOf("ensureCandidatesForAnalysis(completedAnalysis.id)");
  const aiIndex = source.indexOf(
    "const aiAnalysis = await runProjectDocumentAnalysis",
  );

  assert.ok(completedIndex > -1);
  assert.ok(ensureIndex > completedIndex);
  assert.ok(aiIndex > ensureIndex);
});

test("project document analysis locale message keys stay in parity and Serbian remains Latin", () => {
  const referenceKeys = flattenKeys(
    readMessages("en").ProjectDocumentationAnalysis,
  ).sort();
  const cyrillicPattern = /[\u0400-\u04FF]/;

  for (const locale of locales) {
    const messages = readMessages(locale);
    const keys = flattenKeys(messages.ProjectDocumentationAnalysis).sort();

    assert.deepEqual(keys, referenceKeys, `${locale} key mismatch`);
  }

  assert.doesNotMatch(
    JSON.stringify(readMessages("sr").ProjectDocumentationAnalysis),
    cyrillicPattern,
  );
});
