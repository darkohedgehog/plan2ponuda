import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../prisma/migrations/20260623090000_enable_rls_on_public_app_tables/migration.sql",
  import.meta.url,
);

const appTables = [
  "User",
  "UserSettings",
  "PasswordResetToken",
  "EmailVerificationToken",
  "Project",
  "Room",
  "RoomSuggestion",
  "Material",
  "ProjectMaterial",
  "Analysis",
  "Quote",
  "ProjectDocument",
  "ProjectDocumentAnalysis",
  "ProjectDocumentCandidate",
  "Subscription",
  "BillingProfile",
  "BillingEvent",
  "InvoiceTask",
  "UsageCounter",
  "RateLimitBucket",
];

test("Prisma migration enables RLS on all public app tables without public policies", () => {
  assert.ok(existsSync(migrationPath), "Expected the RLS migration file to exist");

  const source = readFileSync(migrationPath, "utf8");
  const expectedStatements = appTables.map(
    (tableName) =>
      `ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;`,
  );

  for (const statement of expectedStatements) {
    assert.match(source, new RegExp(escapeRegExp(statement)));
  }

  assert.deepEqual(
    source.match(/ALTER TABLE public\."[^"]+" ENABLE ROW LEVEL SECURITY;/g),
    expectedStatements,
  );
  assert.doesNotMatch(source, /\bCREATE\s+POLICY\b/i);
  assert.doesNotMatch(source, /\bTO\s+(anon|authenticated)\b/i);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
