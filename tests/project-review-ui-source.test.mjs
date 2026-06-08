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

test("review floor plan preview does not expose signed URL expiry details", () => {
  const source = readSource("src/components/analysis/room-review.tsx");

  assert.doesNotMatch(source, /expiresInMinutes/);
  assert.doesNotMatch(source, /imageCaption/);
  assert.doesNotMatch(source, /getExpiryMinutes/);
});

test("AI analysis button renders localized patience notice", () => {
  const source = readSource(
    "src/components/analysis/analyze-floor-plan-button.tsx",
  );

  assert.match(source, /analysis\.messages\.patienceNotice/);

  for (const locale of locales) {
    const notice = readMessages(locale).Review.analysis.messages.patienceNotice;

    assert.equal(typeof notice, "string", `${locale} notice missing`);
    assert.ok(notice.length > 0, `${locale} notice should not be empty`);
  }

  assert.doesNotMatch(
    JSON.stringify(readMessages("sr").Review.analysis.messages),
    /[\u0400-\u04ff]/,
  );
});
