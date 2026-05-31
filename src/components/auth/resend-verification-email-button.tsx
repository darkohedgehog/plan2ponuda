"use client";

import { MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ResendEmailVerificationResponse } from "@/types/auth";

type ResendMessage = {
  text: string;
  tone: "error" | "success";
};

function isResendEmailVerificationResponse(
  value: unknown,
): value is ResendEmailVerificationResponse {
  return Boolean(value && typeof value === "object" && "ok" in value);
}

async function readResendResponse(
  response: Response,
): Promise<ResendEmailVerificationResponse | null> {
  const payload = await response.json().catch((): unknown => null);

  return isResendEmailVerificationResponse(payload) ? payload : null;
}

export function ResendVerificationEmailButton() {
  const locale = useLocale();
  const t = useTranslations("EmailVerification");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<ResendMessage | null>(null);

  async function handleResend() {
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        body: JSON.stringify({
          locale,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await readResendResponse(response);

      if (response.ok && payload?.ok) {
        setMessage({
          text:
            payload.code === "already_verified"
              ? t("alreadyVerified")
              : t("sent"),
          tone: "success",
        });
        return;
      }

      setMessage({
        text: payload?.ok === false && payload.error.code === "rate_limited"
          ? t("tooMany")
          : t("couldNotSend"),
        tone: "error",
      });
    } catch {
      setMessage({
        text: t("couldNotSend"),
        tone: "error",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <Button
        disabled={isSending}
        onClick={handleResend}
        type="button"
        variant="secondary"
      >
        <MailCheck aria-hidden="true" className="h-4 w-4" />
        {isSending ? t("sending") : t("resend")}
      </Button>
      {message ? (
        <p
          className={
            message.tone === "success"
              ? "text-sm text-emerald-700"
              : "text-sm text-red-700"
          }
          role={message.tone === "success" ? "status" : "alert"}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
