import "server-only";
export type { Analysis, CategoryResult, DataStatus, MetricResult, Recommendation, RepositoryDetails, RepositorySummary } from "@/lib/api-types";
import type { Analysis, CategoryResult, MetricResult, Recommendation, RepositoryDetails, RepositorySummary } from "@/lib/api-types";

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

export function badgeUrl(repositoryId: string): string {
  const publicBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? apiBaseUrl()).replace(/\/$/, "");
  return `${publicBaseUrl}/repositories/${encodeURIComponent(repositoryId)}/badge.svg`;
}

export function getRanking(limit = 100) {
  return request<{ items: RepositorySummary[]; pagination: { total: number; limit: number; offset: number } }>(`/ranking?limit=${limit}&sortBy=score&order=desc`);
}
export function getRepository(id: string) { return request<RepositoryDetails>(`/repositories/${encodeURIComponent(id)}`); }
export function getHealth(id: string) { return request<{ analysisId: string; score: number; potentialScore: number; dataCoverage: number; methodology: string; completedAt: string; categories: CategoryResult[] }>(`/repositories/${encodeURIComponent(id)}/health`); }
export function getMetrics(id: string) { return request<{ analysisId: string; categories: Array<CategoryResult & { metrics: MetricResult[] }> }>(`/repositories/${encodeURIComponent(id)}/metrics`); }
export function getRecommendations(id: string) { return request<{ analysisId: string; potentialScore: number; items: Recommendation[] }>(`/repositories/${encodeURIComponent(id)}/recommendations`); }
export function getAnalysis(id: string) { return request<Analysis>(`/analyses/${encodeURIComponent(id)}`); }
export function getHistory(id: string) { return request<{ items: Array<{ id: string; score: number; potentialScore: number | null; dataCoverage: number; completedAt: string }> }>(`/repositories/${encodeURIComponent(id)}/history?limit=30`); }
