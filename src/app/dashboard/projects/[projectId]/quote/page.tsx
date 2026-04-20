import { QuoteSummary } from "@/components/quote/quote-summary";

type ProjectQuotePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectQuotePage({ params }: ProjectQuotePageProps) {
  const { projectId } = await params;

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Quote</h1>
      <QuoteSummary projectName={projectId} />
    </main>
  );
}
