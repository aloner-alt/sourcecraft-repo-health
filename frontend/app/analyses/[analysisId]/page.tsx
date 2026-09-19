import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AnalysisStatus } from "@/components/analysis-status";
import { ApiError, getAnalysis } from "@/lib/api";

async function loadAnalysis(analysisId: string) {
  try {
    return await getAnalysis(analysisId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function AnalysisPage({ params }: PageProps<"/analyses/[analysisId]">) {
  await connection();
  const { analysisId } = await params;
  const analysis = await loadAnalysis(analysisId);
  return <AnalysisStatus initial={analysis} />;
}
