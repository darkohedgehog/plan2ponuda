import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("mailer service is server-only and uses nodemailer", () => {
  const source = readSource("src/server/services/mail-service.ts");

  assert.match(source, /import "server-only"/);
  assert.match(source, /from "nodemailer"/);
  assert.match(source, /createTransport/);
  assert.match(source, /sendPasswordResetEmail/);
  assert.doesNotMatch(source, /SMTP_PASSWORD.*console/);
});

test("forgot-password flow sends email without breaking neutral responses", () => {
  const source = readSource("src/server/services/auth-service.ts");

  assert.match(source, /sendPasswordResetEmail/);
  assert.match(source, /buildResetUrl\(baseUrl, rawToken\)/);
  assert.match(source, /Password reset email delivery failed/);
  assert.match(source, /return result/);
  assert.match(
    source,
    /sendPasswordResetEmail\([\s\S]*?\.catch\(\(error: unknown\) => \{[\s\S]*?Password reset email delivery failed[\s\S]*?\}\);/,
  );
});

test("SMTP variables are not referenced from client or UI code", () => {
  const checkedFiles = [
    "src/components/auth/forgot-password-form.tsx",
    "src/components/auth/reset-password-form.tsx",
    "src/app/api/auth/forgot-password/route.ts",
  ];

  for (const file of checkedFiles) {
    const source = readSource(file);

    assert.doesNotMatch(source, /SMTP_/);
  }
});
