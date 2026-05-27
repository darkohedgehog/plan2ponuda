export const PASSWORD_RESET_EMAIL_SUBJECT = "Reset your Ploro AI password";
export const EMAIL_VERIFICATION_EMAIL_SUBJECT = "Verify your Ploro AI email";

export type PasswordResetEmailMessage = {
  html: string;
  subject: string;
  text: string;
};

export type EmailVerificationEmailMessage = {
  html: string;
  subject: string;
  text: string;
};

export type BuildPasswordResetEmailMessageParams = {
  expiresInHours: number;
  resetUrl: string;
};

export type BuildEmailVerificationEmailMessageParams = {
  expiresInHours: number;
  verificationUrl: string;
};

export function buildPasswordResetEmailMessage(
  params: BuildPasswordResetEmailMessageParams,
): PasswordResetEmailMessage {
  const expirationText =
    params.expiresInHours === 1
      ? "This link expires in 1 hour."
      : `This link expires in ${params.expiresInHours} hours.`;
  const safeResetUrl = escapeHtmlAttribute(params.resetUrl);

  return {
    html: [
      "<p>Hello,</p>",
      "<p>We received a request to reset your Ploro AI password.</p>",
      `<p><a href="${safeResetUrl}">Reset your Ploro AI password</a></p>`,
      `<p>${escapeHtml(expirationText)}</p>`,
      "<p>If you did not request a password reset, you can ignore this email.</p>",
    ].join("\n"),
    subject: PASSWORD_RESET_EMAIL_SUBJECT,
    text: [
      "Reset your Ploro AI password",
      "",
      "We received a request to reset your Ploro AI password.",
      "",
      params.resetUrl,
      "",
      expirationText,
      "If you did not request a password reset, you can ignore this email.",
    ].join("\n"),
  };
}

export function buildEmailVerificationEmailMessage(
  params: BuildEmailVerificationEmailMessageParams,
): EmailVerificationEmailMessage {
  const expirationText =
    params.expiresInHours === 1
      ? "This link expires in 1 hour."
      : `This link expires in ${params.expiresInHours} hours.`;
  const safeVerificationUrl = escapeHtmlAttribute(params.verificationUrl);

  return {
    html: [
      "<p>Hello,</p>",
      "<p>Confirm your Ploro AI email address to unlock uploads, AI analysis, and quote tools.</p>",
      `<p><a href="${safeVerificationUrl}">Verify your Ploro AI email</a></p>`,
      `<p>${escapeHtml(expirationText)}</p>`,
      "<p>If you did not create a Ploro AI account, you can ignore this email.</p>",
    ].join("\n"),
    subject: EMAIL_VERIFICATION_EMAIL_SUBJECT,
    text: [
      "Verify your Ploro AI email",
      "",
      "Confirm your Ploro AI email address to unlock uploads, AI analysis, and quote tools.",
      "",
      params.verificationUrl,
      "",
      expirationText,
      "If you did not create a Ploro AI account, you can ignore this email.",
    ].join("\n"),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value);
}
