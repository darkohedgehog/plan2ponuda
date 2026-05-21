import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getSmtpServerEnv } from "@/lib/utils/env";
import type { SmtpServerEnv } from "@/lib/utils/smtp-env";
import { buildPasswordResetEmailMessage } from "@/server/services/mail-message";

const PASSWORD_RESET_LINK_EXPIRES_IN_HOURS = 1;

let smtpTransporter: Transporter | null = null;

export type SendPasswordResetEmailParams = {
  resetUrl: string;
  toEmail: string;
};

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams,
): Promise<void> {
  const env = getSmtpServerEnv();
  const message = buildPasswordResetEmailMessage({
    expiresInHours: PASSWORD_RESET_LINK_EXPIRES_IN_HOURS,
    resetUrl: params.resetUrl,
  });

  await getSmtpTransporter(env).sendMail({
    from: {
      address: env.fromEmail,
      name: env.fromName,
    },
    html: message.html,
    subject: message.subject,
    text: message.text,
    to: params.toEmail,
  });
}

function getSmtpTransporter(env: SmtpServerEnv): Transporter {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  smtpTransporter = nodemailer.createTransport({
    auth: {
      pass: env.password,
      user: env.user,
    },
    host: env.host,
    port: env.port,
    secure: env.secure,
  });

  return smtpTransporter;
}
