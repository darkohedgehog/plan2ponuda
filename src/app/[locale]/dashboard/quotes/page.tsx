import { QuotesIndex } from "@/components/quote/quotes-index";
import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserQuotes } from "@/server/services/quote-service";

type QuotesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function QuotesPage({ params }: QuotesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }

  const quotes = await getUserQuotes(user.id);

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-blue-700">Quote exports</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Quotes
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review generated quote totals and export client-ready PDFs from one
          place.
        </p>
      </section>

      <QuotesIndex quotes={quotes} />
    </main>
  );
}
