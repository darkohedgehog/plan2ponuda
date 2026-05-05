import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Link } from "@/i18n/navigation";

export default function SignInPage() {
  const tAuth = useTranslations("Auth");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-10">
      <Link
        className="w-fit text-sm font-semibold text-slate-500 outline-none transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100"
        href="/"
      >
        {tAuth("backToHome")}
      </Link>
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">
          {tAuth("pages.signIn.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {tAuth("pages.signIn.subtitle")}
        </p>
      </div>
      <Suspense fallback={<SignInFormFallback />}>
        <SignInForm />
      </Suspense>
      <p className="text-center text-sm text-slate-600">
        {tAuth("pages.signIn.noAccount")}{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/sign-up"
        >
          {tAuth("signUp")}
        </Link>
      </p>
    </main>
  );
}

function SignInFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 rounded-md border border-slate-200 bg-slate-100" />
      <div className="h-10 rounded-md border border-slate-200 bg-slate-100" />
      <div className="h-10 rounded-md bg-slate-200" />
    </div>
  );
}
