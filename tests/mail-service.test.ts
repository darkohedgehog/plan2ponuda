import assert from "node:assert/strict";
import test from "node:test";

import { parseSmtpServerEnv } from "../src/lib/utils/smtp-env";
import {
  buildPasswordResetEmailMessage,
  PASSWORD_RESET_EMAIL_SUBJECT,
} from "../src/server/services/mail-message";

test("parses SMTP environment safely", () => {
  const env = parseSmtpServerEnv({
    SMTP_FROM_EMAIL: "contact@ploroai.io",
    SMTP_FROM_NAME: "Ploro AI",
    SMTP_HOST: "smtp.hostinger.com",
    SMTP_PASSWORD: "super-secret-password",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
    SMTP_USER: "contact@ploroai.io",
  });

  assert.deepEqual(env, {
    fromEmail: "contact@ploroai.io",
    fromName: "Ploro AI",
    host: "smtp.hostinger.com",
    password: "super-secret-password",
    port: 465,
    secure: true,
    user: "contact@ploroai.io",
  });
});

test("rejects missing or invalid SMTP environment without exposing values", () => {
  assert.throws(
    () =>
      parseSmtpServerEnv({
        SMTP_FROM_EMAIL: "contact@ploroai.io",
        SMTP_FROM_NAME: "Ploro AI",
        SMTP_HOST: "smtp.hostinger.com",
        SMTP_PASSWORD: "super-secret-password",
        SMTP_PORT: "not-a-port",
        SMTP_SECURE: "true",
        SMTP_USER: "contact@ploroai.io",
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /SMTP_PORT/);
      assert.doesNotMatch(error.message, /super-secret-password/);
      return true;
    },
  );
});

test("builds safe password reset email content", () => {
  const resetUrl =
    "https://ploroai.io/reset-password?token=raw-reset-token-value";
  const message = buildPasswordResetEmailMessage({
    expiresInHours: 1,
    resetUrl,
  });

  assert.equal(message.subject, PASSWORD_RESET_EMAIL_SUBJECT);
  assert.match(message.text, /Reset your Ploro AI password/);
  assert.match(message.text, /expires in 1 hour/);
  assert.match(message.text, /ignore this email/);
  assert.match(message.text, /https:\/\/ploroai\.io\/reset-password\?token=/);
  assert.match(message.html, /Reset your Ploro AI password/);
  assert.match(message.html, /expires in 1 hour/);
  assert.match(message.html, /href="https:\/\/ploroai\.io\/reset-password\?token=raw-reset-token-value"/);
  assert.doesNotMatch(message.text, /SMTP_PASSWORD/);
  assert.doesNotMatch(message.html, /SMTP_PASSWORD/);
});
