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
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.keys(value).flatMap((key) =>
    flattenKeys(value[key], prefix ? `${prefix}.${key}` : key),
  );
}

test("dashboard guide route, nav item, and image fallback exist", () => {
  const page = readSource("src/app/[locale]/dashboard/guide/page.tsx");
  const navigation = readSource("src/components/dashboard/dashboard-navigation.ts");
  const shell = readSource("src/components/dashboard/dashboard-shell.tsx");

  assert.match(page, /useTranslations\("Guide"\)/);
  assert.match(page, /NextImage/);
  assert.match(page, /existsSync/);
  assert.match(page, /TODO: Add real guide screenshots/);
  assert.match(page, /href: "\/dashboard\/projects"/);
  assert.match(page, /href: "\/dashboard\/billing"/);
  assert.match(page, /href: "\/contact"/);

  assert.match(navigation, /href: "\/dashboard\/guide"/);
  assert.match(navigation, /labelKey: "guide"/);
  assert.match(navigation, /id: "guide"/);
  assert.match(shell, /BookOpen/);
  assert.match(shell, /guide: BookOpen/);
});

test("dashboard guide translations exist with matching locale keys", () => {
  const referenceKeys = flattenKeys(readMessages("en").Guide).sort();

  for (const locale of locales) {
    const messages = readMessages(locale);
    const guideKeys = flattenKeys(messages.Guide).sort();

    assert.deepEqual(guideKeys, referenceKeys, `${locale} Guide key mismatch`);
    assert.equal(typeof messages.Navigation.guide, "string");
    assert.ok(messages.Navigation.guide.length > 0);
    assert.equal(typeof messages.Dashboard.headers.guide.title, "string");
    assert.equal(typeof messages.Dashboard.headers.guide.subtitle, "string");
  }

  assert.equal(readMessages("hr").Navigation.guide, "Uputstvo");
  assert.equal(readMessages("sr").Navigation.guide, "Uputstvo");
  assert.equal(readMessages("de").Navigation.guide, "Anleitung");
  assert.equal(readMessages("sl").Navigation.guide, "Vodnik");
});

test("serbian guide copy remains latin script", () => {
  const messages = readMessages("sr");
  const guideText = JSON.stringify({
    guide: messages.Guide,
    navigation: messages.Navigation.guide,
    header: messages.Dashboard.headers.guide,
  });

  assert.doesNotMatch(guideText, /[\u0400-\u04ff]/);
});
