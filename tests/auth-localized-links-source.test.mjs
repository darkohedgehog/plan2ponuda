import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("localized auth link helper builds verification links with a validated locale", () => {
  const helperPath = "src/lib/auth/localized-auth-links.ts";

  assert.ok(existsSync(new URL(`../${helperPath}`, import.meta.url)));

  const source = readSource(helperPath);

  assert.match(source, /resolveLocale\(locale \?\? undefined\)/);
  assert.match(source, /new URL\(`\/\$\{resolvedLocale\}\/verify-email`, baseUrl\)/);
  assert.match(source, /searchParams\.set\("token", token\)/);
});

test("localized auth link helper defaults unsupported locales to Croatian", () => {
  const source = readSource("src/lib/auth/localized-auth-links.ts");

  assert.match(source, /defaultLocale/);
  assert.match(source, /return resolveLocale\(locale \?\? undefined\)/);
});

test("localized auth link helper builds reset links with a validated locale", () => {
  const source = readSource("src/lib/auth/localized-auth-links.ts");

  assert.match(source, /new URL\(`\/\$\{resolvedLocale\}\/reset-password`, baseUrl\)/);
  assert.match(source, /searchParams\.set\("token", token\)/);
});

test("legacy auth redirect helper preserves query strings for old verification and reset links", () => {
  const source = readSource("src/lib/auth/localized-auth-links.ts");

  assert.match(source, /"\/verify-email"/);
  assert.match(source, /"\/reset-password"/);
  assert.match(source, /new URL\(requestUrl\)/);
  assert.match(source, /url\.pathname = `\/\$\{defaultLocale\}\$\{url\.pathname\}`/);
  assert.match(source, /return url\.toString\(\)/);
  assert.doesNotMatch(source, /searchParams\.get\("token"\)/);
});
