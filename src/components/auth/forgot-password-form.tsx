"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import type { ForgotPasswordResponse } from "@/types/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDevResetUrl(null);
    setSuccessMessage(null);
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
      setError(
        payload && !payload.ok
          ? payload.error.message
          : "Unable to process password reset request.",
      );
      return;
    }

    setSuccessMessage(payload.message);
    setDevResetUrl(payload.devResetUrl ?? null);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}
      {devResetUrl ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Development reset URL</p>
          <Link className="mt-1 block break-all underline" href={devResetUrl}>
            {devResetUrl}
          </Link>
        </div>
      ) : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending..." : "Send reset instructions"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        Remembered your password?{" "}
        <Link className="font-semibold text-blue-700 hover:text-blue-800" href="/sign-in">
          Sign in
        </Link>
      </p>
    </form>
  );
}
