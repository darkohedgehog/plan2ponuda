import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Link } from "@/i18n/navigation";

export default function SignInPage() {
  const tAuth = useTranslations("Auth");

  return (
    <main className="flex min-h-screen items-center justify-center bg-frosted-blue-50 px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-frosted-blue-200 bg-white/95 p-6 shadow-xl shadow-frosted-blue-200/60 sm:p-8">
        <Link
          className="w-fit text-sm font-semibold text-deep-twilight-700/70 outline-none transition-colors hover:text-bright-teal-blue-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100"
          href="/"
        >
          {tAuth("backToHome")}
        </Link>
        <div className="mt-6">
          <h1 className="text-3xl font-semibold text-deep-twilight-950">
            {tAuth("pages.signIn.title")}
          </h1>
          <p className="mt-2 text-sm text-deep-twilight-700">
            {tAuth("pages.signIn.subtitle")}
          </p>
        </div>
        <div className="mt-6">
          <Suspense fallback={<SignInFormFallback />}>
            <SignInForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-deep-twilight-700">
          {tAuth("pages.signIn.noAccount")}{" "}
          <Link
            className="font-semibold text-bright-teal-blue-700 hover:text-bright-teal-blue-800"
            href="/sign-up"
          >
            {tAuth("signUp")}
          </Link>
        </p>
      </section>
    </main>
  );
}

function SignInFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 rounded-md border border-frosted-blue-200 bg-frosted-blue-100" />
      <div className="h-10 rounded-md border border-frosted-blue-200 bg-frosted-blue-100" />
      <div className="h-10 rounded-md bg-frosted-blue-200" />
    </div>
  );
}
