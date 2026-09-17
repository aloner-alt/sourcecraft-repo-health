export type DashboardCategory = {
  id: string;
  name: string;
  value: number | null;
  weight: number;
  status: string;
  reason: string;
  fact: string;
  raw: string;
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
