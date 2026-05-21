import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("billing service exposes an atomic usage consume helper", () => {
  const source = readSource("src/server/services/billing-service.ts");

  assert.match(source, /class UsageLimitExceededError extends Error/);
  assert.match(source, /export async function consumeUsageOrThrow/);
  assert.match(source, /usageCounter\.updateMany/);
  assert.match(source, /where:\s*\{[\s\S]*count:\s*\{[\s\S]*lt:\s*limit/);
  assert.match(source, /throw new UsageLimitExceededError/);
});

test("floor plan upload consumes usage inside the project update transaction", () => {
  const source = readSource("src/server/services/project-service.ts");

  assert.match(source, /findAndLockProjectForFloorPlanUpload/);
  assert.match(source, /FOR UPDATE/);
  assert.match(source, /consumeUsageOrThrow/);
  assert.match(source, /"floor_plans_created"/);
  assert.match(source, /removeProjectStorageFiles\(\[filePath\]\)/);
  assert.doesNotMatch(source, /canUseFeature/);
  assert.doesNotMatch(source, /incrementUsage/);
});

test("quote creation consumes usage inside quote write transactions", () => {
  const source = readSource("src/server/services/quote-service.ts");

  assert.match(source, /findAndLockProjectForQuote/);
  assert.match(source, /FOR UPDATE/);
  assert.match(source, /consumeUsageOrThrow/);
  assert.match(source, /"quotes_created"/);
  assert.match(source, /db\.quote\.create/);
  assert.match(source, /db\.quote\.update/);
  assert.doesNotMatch(source, /canUseFeature/);
  assert.doesNotMatch(source, /incrementUsage/);
});
