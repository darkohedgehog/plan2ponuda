import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const auditedFiles = [
  "src/server/services/project-service.ts",
  "src/server/services/quote-service.ts",
  "src/server/services/rate-limit-service.ts",
];

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("raw SQL usage avoids unsafe Prisma APIs and string-built SQL", () => {
  for (const file of auditedFiles) {
    const source = readSource(file);

    assert.doesNotMatch(source, /\$queryRawUnsafe/);
    assert.doesNotMatch(source, /\$executeRawUnsafe/);
    assert.doesNotMatch(source, /new\s+Pool\s*\(/);
    assert.doesNotMatch(source, /new\s+Client\s*\(/);
    assert.doesNotMatch(source, /from\s+["']pg["']/);
    assert.doesNotMatch(source, /query\s*:\s*`[\s\S]*?\$\{/);
  }
});

test("known raw SQL locks and rate-limit queries use Prisma parameterization", () => {
  const projectService = readSource("src/server/services/project-service.ts");
  const quoteService = readSource("src/server/services/quote-service.ts");
  const rateLimitService = readSource("src/server/services/rate-limit-service.ts");

  assert.match(projectService, /db\.\$queryRaw<LockedProjectUploadRow\[\]>`\s*SELECT[\s\S]*WHERE id = \$\{projectId\} AND "userId" = \$\{userId\}/);
  assert.match(quoteService, /db\.\$queryRaw<LockedQuoteProjectRow\[\]>`\s*SELECT[\s\S]*WHERE id = \$\{projectId\} AND "userId" = \$\{userId\}/);
  assert.match(rateLimitService, /client\.\$queryRaw<RateLimitBucketRow\[\]>\(Prisma\.sql`/);
  assert.match(rateLimitService, /"key" = \$\{options\.key\}/);
  assert.match(rateLimitService, /"scope" = \$\{options\.scope\}/);
});
