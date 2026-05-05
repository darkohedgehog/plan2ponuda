import { useTranslations } from "next-intl";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Link } from "@/i18n/navigation";

export default function SignUpPage() {
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
          {tAuth("pages.signUp.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {tAuth("pages.signUp.subtitle")}
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-slate-600">
        {tAuth("pages.signUp.hasAccount")}{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/sign-in"
        >
          {tAuth("signIn")}
        </Link>
      </p>
    </main>
  );
}
