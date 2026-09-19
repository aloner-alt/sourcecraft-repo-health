import "client-only";

import type { Analysis, RepositorySummary } from "@/lib/api-types";

export type SessionUser = {
  id: string;
  sub: string;
  login: string;
  email?: string;
  name?: string;
};

export function publicApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
}

export async function clientRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${publicApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    let message = `Запрос завершился с ошибкой ${response.status}.`;
    try {
      const body = await response.json() as { message?: string | string[] };
      message = Array.isArray(body.message) ? body.message.join(" ") : body.message ?? message;
    } catch {
      // Non-JSON backend errors keep the status-based message.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const loadSession = () => clientRequest<SessionUser>("/auth/me");
export const loadMyRepositories = () => clientRequest<RepositorySummary[]>("/repositories/mine");
export const loadAnalysis = (id: string) => clientRequest<Analysis>(`/analyses/${encodeURIComponent(id)}`);
