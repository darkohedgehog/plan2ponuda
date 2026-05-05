"use client";

import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import {
  PasswordInput,
  PasswordStrengthIndicator,
} from "@/components/auth/password-input";
import type { SignUpErrorCode, SignUpResponse } from "@/types/auth";

export function SignUpForm() {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tAuth = useTranslations("Auth");
  const tValidation = useTranslations("Validation");
  const router = useRouter();
  const dashboardUrl = `/${locale}/dashboard`;
  const signInUrl = `/${locale}/sign-in`;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        password,
      }),
    });
    const payload = (await response.json()) as SignUpResponse;

    if (!response.ok || !payload.ok) {
      const signUpErrorMessages = {
        email_already_exists: tValidation("emailAlreadyExists"),
        invalid_input: tValidation("invalidInput"),
        server_error: tValidation("unableCreateAccount"),
      } satisfies Record<SignUpErrorCode, string>;
      const message = "error" in payload
        ? signUpErrorMessages[payload.error.code]
        : tValidation("unableCreateAccount");
      setError(message);
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: dashboardUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      router.push(signInUrl);
      return;
    }

    router.push(result.url ?? dashboardUrl);
    router.refresh();
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
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? tActions("creatingAccount") : tActions("createAccount")}
      </Button>
    </form>
  );
}
