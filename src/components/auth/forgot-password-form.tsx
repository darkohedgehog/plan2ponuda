"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import { Link } from "@/i18n/navigation";
import type {
  ForgotPasswordErrorCode,
  ForgotPasswordResponse,
} from "@/types/auth";

export function ForgotPasswordForm() {
  const tActions = useTranslations("Actions");
  const tAuth = useTranslations("Auth");
  const tValidation = useTranslations("Validation");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [hasSuccessMessage, setHasSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDevResetUrl(null);
    setHasSuccessMessage(false);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      body: JSON.stringify({
        email,
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
      } satisfies Record<ForgotPasswordErrorCode, string>;
      setError(
        payload && !payload.ok
          ? forgotPasswordErrorMessages[payload.error.code]
          : tValidation("unableProcessPasswordReset"),
      );
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
      <p className="text-center text-sm text-slate-600">
        {tAuth("pages.forgotPassword.rememberedPassword")}{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/sign-in"
        >
          {tAuth("signIn")}
        </Link>
      </p>
    </form>
  );
}
