"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ComponentProps, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import {
  PasswordInput,
  PasswordStrengthIndicator,
} from "@/components/auth/password-input";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import type { SignUpErrorCode, SignUpResponse } from "@/types/auth";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type SignUpFormProps = {
  turnstileEnabled: boolean;
};

export function SignUpForm({ turnstileEnabled }: SignUpFormProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tAuth = useTranslations("Auth");
  const tValidation = useTranslations("Validation");
  const router = useRouter();
  const signInUrl = `/${locale}/sign-in`;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    setTurnstileResetKey((currentKey) => currentKey + 1);
  }, []);

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(tValidation("passwordsDoNotMatch"));
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: fullName.trim() || undefined,
        email,
        locale,
        password,
        ...(turnstileEnabled ? { turnstileToken } : {}),
      }),
    });
    const payload = (await response.json()) as SignUpResponse;

    if (!response.ok || !payload.ok) {
      const signUpErrorMessages = {
        email_already_exists: tValidation("emailAlreadyExists"),
        invalid_input: tValidation("invalidInput"),
        rate_limited: tValidation("tooManyAttempts"),
        server_error: tValidation("unableCreateAccount"),
        turnstile_failed: tValidation("verificationFailed"),
      } satisfies Record<SignUpErrorCode, string>;
      const message = "error" in payload
        ? signUpErrorMessages[payload.error.code]
        : tValidation("unableCreateAccount");
      setError(message);
      setIsSubmitting(false);
      resetTurnstile();
      return;
    }

    setIsSubmitting(false);
    router.push(signInUrl);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        autoComplete="name"
        className={formControlClassName}
        name="fullName"
        onChange={(event) => setFullName(event.target.value)}
        placeholder={tAuth("fullName")}
        type="text"
        value={fullName}
      />
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
      <PasswordInput
        autoComplete="new-password"
        minLength={8}
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={tAuth("password")}
        required
        value={password}
      />
      <PasswordStrengthIndicator password={password} />
      <PasswordInput
        autoComplete="new-password"
        minLength={8}
        name="confirmPassword"
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder={tAuth("confirmPassword")}
        required
        value={confirmPassword}
      />
      {passwordsDoNotMatch ? (
        <p className="text-sm text-red-600">
          {tValidation("passwordsDoNotMatch")}
        </p>
      ) : null}
      <TurnstileWidget
        action="sign-up"
        enabled={turnstileEnabled}
        onTokenChange={setTurnstileToken}
        resetKey={turnstileResetKey}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? tActions("creatingAccount") : tActions("createAccount")}
      </Button>
    </form>
  );
}
