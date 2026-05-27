import { CheckCircle2, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { verifyEmailToken } from "@/server/services/auth-service";

type VerifyEmailPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function VerifyEmailPage({
  params,
  searchParams,
}: VerifyEmailPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const { token } = await searchParams;
  const tAuth = await getTranslations("Auth");
  const tCommon = await getTranslations("Common");
  const isVerified = token ? await verifyEmailToken(token) : false;

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
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-frosted-blue-200 bg-frosted-blue-50 text-bright-teal-blue-700">
            {isVerified ? (
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            ) : (
              <XCircle aria-hidden="true" className="h-5 w-5 text-red-600" />
            )}
          </div>
          <h1 className="text-3xl font-semibold text-deep-twilight-950">
            {tAuth("pages.verifyEmail.title")}
          </h1>
          <p className="mt-2 text-sm text-deep-twilight-700">
            {isVerified
              ? tAuth("messages.emailVerificationSuccess")
              : tAuth("messages.emailVerificationInvalid")}
          </p>
        </div>
        <div className="mt-6">
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-deep-twilight-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2"
            href={isVerified ? "/dashboard" : "/sign-in"}
            locale={locale}
          >
            {isVerified ? tCommon("dashboard") : tAuth("signIn")}
          </Link>
        </div>
      </section>
    </main>
  );
}
