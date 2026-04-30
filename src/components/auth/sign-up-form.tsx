"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import {
  PasswordInput,
  PasswordStrengthIndicator,
} from "@/components/auth/password-input";
import type { SignUpResponse } from "@/types/auth";

export function SignUpForm() {
  const router = useRouter();
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
      setError("Passwords do not match.");
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
      const message =
        "error" in payload ? payload.error.message : "Unable to create account.";
      setError(message);
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      router.push("/sign-in");
      return;
    }

    router.push(result.url ?? "/dashboard");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        autoComplete="name"
        className={formControlClassName}
        name="fullName"
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Full name"
        type="text"
        value={fullName}
      />
      <input
        autoComplete="email"
        className={formControlClassName}
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
        type="email"
        value={email}
      />
      <PasswordInput
        autoComplete="new-password"
        minLength={8}
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        required
        value={password}
      />
      <PasswordStrengthIndicator password={password} />
      <PasswordInput
        autoComplete="new-password"
        minLength={8}
        name="confirmPassword"
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm password"
        required
        value={confirmPassword}
      />
      {passwordsDoNotMatch ? (
        <p className="text-sm text-red-600">Passwords do not match.</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
