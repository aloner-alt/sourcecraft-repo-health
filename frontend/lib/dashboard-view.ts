export type DashboardCategory = {
  id: string;
  name: string;
  value: number | null;
  weight: number;
  status: string;
  reason: string;
  fact: string;
  raw: string;
  metrics: Array<{
    id: string;
    key: string;
    score: number | null;
    weight: number;
    status: string;
    source: string;
    explanation: string;
    raw: string;
    evidence: Array<{ id: string; label: string; kind: string; url?: string | null; value: string }>;
  }>;
};

export type DashboardRecommendation = {
  id: string;
  categoryId: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  why: string;
  fact: string;
  source: string;
  steps: string[];
  expectedScoreDelta: number;
  confidence: number;
};
