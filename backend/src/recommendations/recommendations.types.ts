import {
  EvidenceKind,
  HealthCategory,
  RecommendationPriority,
} from '@prisma/client';

export type GeneratedRecommendation = {
  category: HealthCategory;
  priority: RecommendationPriority;
  title: string;
  problem: string;
  rationale: string;
  action: string;
  expectedScoreDelta: number;
  confidence: number;
  evidence: Array<{
    kind: EvidenceKind;
    label: string;
    value: Record<string, unknown>;
  }>;
};
