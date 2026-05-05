"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

import {
  PasswordInput,
  PasswordStrengthIndicator,
} from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type {
  ResetPasswordErrorCode,
  ResetPasswordResponse,
} from "@/types/auth";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const tActions = useTranslations("Actions");
  const tAuth = useTranslations("Auth");
  const tValidation = useTranslations("Validation");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    token ? null : tValidation("missingResetToken"),
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError(tValidation("missingResetToken"));
      return;
    }

    if (password !== confirmPassword) {
      setError(tValidation("passwordsDoNotMatch"));
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      body: JSON.stringify({
        password,
        token,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response
      .json()
      .catch((): ResetPasswordResponse | null => null)) as
      | ResetPasswordResponse
      | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      const resetPasswordErrorMessages = {
        invalid_input: tValidation("invalidResetRequest"),
        invalid_or_expired_token: tValidation("passwordResetInvalidOrExpired"),
        server_error: tValidation("unableResetPassword"),
      } satisfies Record<ResetPasswordErrorCode, string>;
      setError(
        payload && !payload.ok
          ? resetPasswordErrorMessages[payload.error.code]
          : tValidation("unableResetPassword"),
      );
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccessMessage(tAuth("messages.passwordResetSuccess"));
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <PasswordInput
        autoComplete="new-password"
        minLength={8}
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={tAuth("newPassword")}
        required
        value={password}
      />
      <PasswordStrengthIndicator password={password} />
      <PasswordInput
        autoComplete="new-password"
        minLength={8}
        name="confirmPassword"
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder={tAuth("confirmNewPassword")}
        required
        value={confirmPassword}
      />
      {passwordsDoNotMatch ? (
        <p className="text-sm text-red-600">
          {tValidation("passwordsDoNotMatch")}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}
      <Button disabled={isSubmitting || Boolean(successMessage)} type="submit">
        {isSubmitting ? tActions("resetting") : tActions("resetPassword")}
      </Button>
      {successMessage ? (
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
          href="/sign-in"
        >
          {tAuth("signIn")}
        </Link>
      ) : null}
    </form>
  );
}
