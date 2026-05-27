"use client";

import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ComponentProps, useCallback, useState } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import { PasswordInput } from "@/components/auth/password-input";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type SignInFormProps = {
  turnstileEnabled: boolean;
};

function getSafeCallbackUrl(
  value: string | null | undefined,
  fallbackUrl: string,
): string {
  if (
    !value ||
    value.trim() !== value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallbackUrl;
  }

  try {
    const url = new URL(value, "http://localhost");

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallbackUrl;
  }
}

export function SignInForm({ turnstileEnabled }: SignInFormProps) {
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tAuth = useTranslations("Auth");
  const tValidation = useTranslations("Validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(
    searchParams.get("callbackUrl"),
    `/${locale}/dashboard`,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    setTurnstileResetKey((currentKey) => currentKey + 1);
  }, []);

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      ...(turnstileEnabled ? { turnstileToken } : {}),
      redirect: false,
      callbackUrl,
    }).catch(() => null);

    setIsSubmitting(false);

    if (!result || result.error) {
      setError(tValidation("invalidEmailOrPassword"));
      resetTurnstile();
      return;
    }

    router.push(getSafeCallbackUrl(result.url, callbackUrl));
    router.refresh();
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
      <PasswordInput
        autoComplete="current-password"
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={tAuth("password")}
        required
        value={password}
      />
      <div className="flex justify-end">
        <Link
          className="text-sm font-semibold text-bright-teal-blue-700 hover:text-bright-teal-blue-800"
          href="/forgot-password"
        >
          {tAuth("forgotPassword")}
        </Link>
      </div>
      <TurnstileWidget
        action="sign-in"
        enabled={turnstileEnabled}
        onTokenChange={setTurnstileToken}
        resetKey={turnstileResetKey}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? tActions("signingIn") : tAuth("signIn")}
      </Button>
    </form>
  );
}
