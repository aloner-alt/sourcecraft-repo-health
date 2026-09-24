export type DataStatus = "AVAILABLE" | "NO_DATA" | "NOT_APPLICABLE" | "COLLECTION_ERROR" | "PERMISSION_DENIED";

export type RepositorySummary = {
  id: string;
  sourcecraftId: string;
  ownerSlug: string;
  slug: string;
  name: string;
  description: string | null;
  webUrl: string;
  primaryLanguage: string | null;
  likesCount: number;
  lastActivityAt: string | null;
  latestScore: number | null;
  latestPotentialScore: number | null;
  latestDataCoverage: number | null;
  lastAnalyzedAt: string | null;
};

export type CategoryResult = { id: string; category: string; score: number | null; weight: number; status: DataStatus; summary: string };
export type Evidence = { id: string; kind: string; label: string; url?: string | null; value: unknown };
export type MetricResult = { id: string; key: string; rawValue: unknown; normalizedScore: number | null; weight: number; status: DataStatus; source: string; explanation: string; evidence: Evidence[] };
export type Recommendation = { id: string; category: string; priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; title: string; problem: string; rationale: string; action: string; expectedScoreDelta: number; confidence: number; evidence: Evidence[] };
export type Analysis = { id: string; repositoryId: string; status: "QUEUED" | "COLLECTING" | "CALCULATING" | "COMPLETED" | "FAILED"; trigger: string; score: number | null; potentialScore: number | null; dataCoverage: number | null; errorCode: string | null; errorMessage: string | null; createdAt: string; startedAt: string | null; completedAt: string | null; repository: RepositorySummary; categories: Array<CategoryResult & { metrics: MetricResult[] }>; recommendations: Recommendation[] };
export type RepositoryDetails = RepositorySummary & { analyses: Analysis[] };
