import { useTranslations } from "next-intl";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  const tAuth = useTranslations("Auth");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-semibold">
          {tAuth("pages.forgotPassword.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {tAuth("pages.forgotPassword.subtitle")}
        </p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
