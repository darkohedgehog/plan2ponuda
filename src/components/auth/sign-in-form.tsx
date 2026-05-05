"use client";

import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import { PasswordInput } from "@/components/auth/password-input";

function getSafeCallbackUrl(value: string | null, fallbackUrl: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallbackUrl;
  }

  return value;
}

export function SignInForm() {
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError(tValidation("invalidEmailOrPassword"));
      return;
    }

    router.push(result.url ?? callbackUrl);
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
          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          href="/forgot-password"
        >
          {tAuth("forgotPassword")}
        </Link>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? tActions("signingIn") : tAuth("signIn")}
      </Button>
    </form>
  );
}
