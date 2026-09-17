import { notFound } from "next/navigation";
import { DemoAnalysis } from "@/components/demo-analysis";
import { myRepositoriesPreview, rankingPreview } from "@/lib/dashboard-preview";

export default async function AnalysisPage({ params }: PageProps<"/analyses/[analysisId]">) {
  const { analysisId } = await params;
  const repository = [...myRepositoriesPreview, ...rankingPreview].find(repo => `${repo.slug}-demo` === analysisId);
  if (!repository) notFound();
  return <DemoAnalysis key={analysisId} repository={repository.name} slug={repository.slug} />;
}
