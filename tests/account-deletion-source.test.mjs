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

test("delete account API is authenticated, validates confirmation, and returns safe blockers", () => {
  const route = readSource("src/app/api/account/route.ts");

  assert.match(route, /export async function DELETE/);
  assert.match(route, /requireApiUser/);
  assert.match(route, /deleteAccountRequestSchema/);
  assert.match(route, /deleteAccount\(/);
  assert.match(route, /confirmation_email_mismatch/);
  assert.match(route, /confirmation_required/);
  assert.match(route, /active_subscription/);
  assert.match(route, /admin_account/);
  assert.match(route, /return 409/);
  assert.match(route, /return 403/);
  assert.doesNotMatch(route, /prisma\./);
});

test("delete account service anonymizes the user and retains legal invoice records", () => {
  const service = readSource("src/server/services/account-deletion-service.ts");

  assert.match(service, /project\.deleteMany/);
  assert.match(service, /passwordResetToken\.deleteMany/);
  assert.match(service, /emailVerificationToken\.deleteMany/);
  assert.match(service, /usageCounter\.deleteMany/);
  assert.match(service, /rateLimitBucket\.deleteMany/);
  assert.match(service, /billingProfile\.deleteMany/);
  assert.match(service, /subscription\.deleteMany/);
  assert.match(service, /user\.update/);
  assert.match(service, /deleted\+/);
  assert.doesNotMatch(service, /user\.delete/);
  assert.doesNotMatch(service, /invoiceTask\.delete/);
  assert.doesNotMatch(service, /material\.delete/);
  assert.doesNotMatch(service, /billingEvent\.delete/);
});

test("delete account service uses project-owned storage path validation only", () => {
  const service = readSource("src/server/services/account-deletion-service.ts");
  const storagePolicy = readSource(
    "src/server/services/account-deletion-storage-policy.ts",
  );

  assert.match(service, /collectAccountDeletionStoragePaths/);
  assert.match(storagePolicy, /getProjectStoragePathsToDelete/);
  assert.match(service, /PROJECT_FILES_BUCKET/);
  assert.match(service, /\.remove\(batch\)/);
  assert.doesNotMatch(service, /filePath:\s*true[\s\S]*\.remove\(.*filePath/s);
});

test("settings page wires self-service delete status into the danger zone", () => {
  const page = readSource("src/app/[locale]/dashboard/settings/page.tsx");
  const component = readSource(
    "src/components/settings/delete-account-danger-zone.tsx",
  );

  assert.match(page, /getAccountDeletionStatus/);
  assert.match(page, /DeleteAccountDangerZone/);
  assert.match(component, /confirmationEmail/);
  assert.match(component, /confirmPermanentDeletion/);
  assert.match(component, /confirmationEmail === email/);
  assert.match(component, /fetch\("\/api\/account"/);
  assert.match(component, /method:\s*"DELETE"/);
  assert.match(component, /signOut/);
  assert.match(component, /active_subscription/);
  assert.match(component, /admin_account/);
});

test("delete account i18n keys exist for every locale and Serbian remains Latin", () => {
  const referenceKeys = flattenKeys(readMessages("en").Settings.dangerZone).sort();

  for (const locale of locales) {
    const messages = readMessages(locale);
    const keys = flattenKeys(messages.Settings.dangerZone).sort();

    assert.deepEqual(keys, referenceKeys, `${locale} danger zone key mismatch`);
    assert.equal(typeof messages.Settings.dangerZone.title, "string");
    assert.equal(typeof messages.Settings.dangerZone.deleteAccount, "string");
    assert.equal(
      typeof messages.Settings.dangerZone.activeSubscription,
      "string",
    );
    assert.equal(typeof messages.Settings.dangerZone.goToBilling, "string");
  }

  assert.doesNotMatch(
    JSON.stringify(readMessages("sr").Settings.dangerZone),
    /[\u0400-\u04ff]/,
  );
});
