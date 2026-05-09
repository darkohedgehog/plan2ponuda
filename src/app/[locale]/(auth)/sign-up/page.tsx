import { useTranslations } from "next-intl";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Link } from "@/i18n/navigation";

export default function SignUpPage() {
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
            {tAuth("pages.signUp.title")}
          </h1>
          <p className="mt-2 text-sm text-deep-twilight-700">
            {tAuth("pages.signUp.subtitle")}
          </p>
        </div>
        <div className="mt-6">
          <SignUpForm />
        </div>
        <p className="mt-6 text-center text-sm text-deep-twilight-700">
          {tAuth("pages.signUp.hasAccount")}{" "}
          <Link
            className="font-semibold text-bright-teal-blue-700 hover:text-bright-teal-blue-800"
            href="/sign-in"
          >
            {tAuth("signIn")}
          </Link>
        </p>
      </section>
    </main>
  );
}
