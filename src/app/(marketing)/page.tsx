import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
        Plan2Ponuda
      </p>
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          Electrical quotes from floor plans, faster.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Upload a plan, review AI-assisted room detection, generate material
          suggestions, and export a client-ready quote.
        </p>
      </div>
      <div className="flex gap-3">
        <Button>Start project</Button>
        <Button variant="secondary">View pricing</Button>
      </div>
    </main>
  );
}
