import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const repoRoot = new URL("../", import.meta.url);

function getLatestMigrationName() {
  return readdirSync(new URL("prisma/migrations", repoRoot), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .at(-1);
}

test("Prisma dev singleton schema version matches the latest migration", () => {
  const latestMigrationName = getLatestMigrationName();
  const source = readFileSync(
    new URL("src/lib/db/prisma.ts", repoRoot),
    "utf8",
  );

  assert.ok(latestMigrationName, "Expected at least one Prisma migration");
  assert.match(
    source,
    new RegExp(
      `PRISMA_CLIENT_SCHEMA_VERSION\\s*=\\s*\\n?\\s*"${latestMigrationName}"`,
    ),
  );
});
