import "server-only";

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
export type MetricResult = { id: string; key: string; rawValue: unknown; normalizedScore: number | null; weight: number; status: DataStatus; source: string; explanation: string; evidence: Array<{ id: string; kind: string; label: string; value: unknown }> };
export type Recommendation = { id: string; category: string; priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; title: string; problem: string; rationale: string; action: string; expectedScoreDelta: number; confidence: number; evidence: Array<{ id: string; kind: string; label: string; value: unknown }> };
export type Analysis = { id: string; repositoryId: string; status: "QUEUED" | "COLLECTING" | "CALCULATING" | "COMPLETED" | "FAILED"; trigger: string; score: number | null; potentialScore: number | null; dataCoverage: number | null; errorCode: string | null; errorMessage: string | null; createdAt: string; startedAt: string | null; completedAt: string | null; repository: RepositorySummary; categories: Array<CategoryResult & { metrics: MetricResult[] }>; recommendations: Recommendation[] };
export type RepositoryDetails = RepositorySummary & { analyses: Analysis[] };

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

function apiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { cache: "no-store" });
  if (!response.ok) {
    let message = `Backend request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(" ");
      else if (body.message) message = body.message;
    } catch {
      // Keep the status-based message for non-JSON responses.
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export function reportUrl(analysisId: string, format: "md" | "pdf"): string {
  const publicBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? apiBaseUrl()
  ).replace(/\/$/, "");
  return `${publicBaseUrl}/analyses/${encodeURIComponent(analysisId)}/reports/report.${format}`;
}

export function getRanking(limit = 100) {
  return request<{ items: RepositorySummary[]; pagination: { total: number; limit: number; offset: number } }>(`/ranking?limit=${limit}&sortBy=score&order=desc`);
}
export function getRepository(id: string) { return request<RepositoryDetails>(`/repositories/${encodeURIComponent(id)}`); }
export function getHealth(id: string) { return request<{ analysisId: string; score: number; potentialScore: number; dataCoverage: number; methodology: string; completedAt: string; categories: CategoryResult[] }>(`/repositories/${encodeURIComponent(id)}/health`); }
export function getMetrics(id: string) { return request<{ analysisId: string; categories: Array<CategoryResult & { metrics: MetricResult[] }> }>(`/repositories/${encodeURIComponent(id)}/metrics`); }
export function getRecommendations(id: string) { return request<{ analysisId: string; potentialScore: number; items: Recommendation[] }>(`/repositories/${encodeURIComponent(id)}/recommendations`); }
export function getAnalysis(id: string) { return request<Analysis>(`/analyses/${encodeURIComponent(id)}`); }
