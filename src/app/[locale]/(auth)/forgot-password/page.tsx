import { useTranslations } from "next-intl";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  const tAuth = useTranslations("Auth");

  return (
    <main className="flex min-h-screen items-center justify-center bg-frosted-blue-50 px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-frosted-blue-200 bg-white/95 p-6 shadow-xl shadow-frosted-blue-200/60 sm:p-8">
        <div>
          <h1 className="text-3xl font-semibold text-deep-twilight-950">
            {tAuth("pages.forgotPassword.title")}
          </h1>
          <p className="mt-2 text-sm text-deep-twilight-700">
            {tAuth("pages.forgotPassword.subtitle")}
          </p>
        </div>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
