"use client";

import { useLocale, useTranslations } from "next-intl";
import { type ComponentProps, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { formControlClassName } from "@/components/ui/form-control";
import { Link } from "@/i18n/navigation";
import type {
  ForgotPasswordErrorCode,
  ForgotPasswordResponse,
} from "@/types/auth";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type ForgotPasswordFormProps = {
  turnstileEnabled: boolean;
};

export function ForgotPasswordForm({
  turnstileEnabled,
}: ForgotPasswordFormProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tAuth = useTranslations("Auth");
  const tValidation = useTranslations("Validation");
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [hasSuccessMessage, setHasSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    setTurnstileResetKey((currentKey) => currentKey + 1);
  }, []);

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setError(null);
    setDevResetUrl(null);
    setHasSuccessMessage(false);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      body: JSON.stringify({
        email,
        locale,
        ...(turnstileEnabled ? { turnstileToken } : {}),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response
      .json()
      .catch((): ForgotPasswordResponse | null => null)) as
      | ForgotPasswordResponse
      | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      const forgotPasswordErrorMessages = {
        invalid_input: tValidation("enterValidEmail"),
        rate_limited: tValidation("passwordResetRateLimited"),
        server_error: tValidation("unableProcessPasswordReset"),
        turnstile_failed: tValidation("verificationFailed"),
      } satisfies Record<ForgotPasswordErrorCode, string>;
      setError(
        payload && !payload.ok
          ? forgotPasswordErrorMessages[payload.error.code]
          : tValidation("unableProcessPasswordReset"),
      );
      resetTurnstile();
      return;
    }

    setHasSuccessMessage(true);
    setDevResetUrl(payload.devResetUrl ?? null);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        autoComplete="email"
        className={formControlClassName}
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder={tAuth("email")}
        required
        type="email"
        value={email}
      />
      <TurnstileWidget
        action="forgot-password"
        enabled={turnstileEnabled}
        onTokenChange={setTurnstileToken}
        resetKey={turnstileResetKey}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {hasSuccessMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {tAuth("messages.resetInstructionsPrepared")}
        </div>
      ) : null}
      {devResetUrl ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">{tAuth("developmentResetUrl")}</p>
          <a className="mt-1 block break-all underline" href={devResetUrl}>
            {devResetUrl}
          </a>
        </div>
      ) : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting
          ? tActions("sending")
          : tActions("sendResetInstructions")}
      </Button>
      <p className="text-center text-sm text-deep-twilight-700">
        {tAuth("pages.forgotPassword.rememberedPassword")}{" "}
        <Link
          className="font-semibold text-bright-teal-blue-700 hover:text-bright-teal-blue-800"
          href="/sign-in"
        >
          {tAuth("signIn")}
        </Link>
      </p>
    </form>
  );
}
