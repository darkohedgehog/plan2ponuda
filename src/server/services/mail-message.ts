export const PASSWORD_RESET_EMAIL_SUBJECT = "Reset your Ploro AI password";

export type PasswordResetEmailMessage = {
  html: string;
  subject: string;
  text: string;
};

export type BuildPasswordResetEmailMessageParams = {
  expiresInHours: number;
  resetUrl: string;
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
