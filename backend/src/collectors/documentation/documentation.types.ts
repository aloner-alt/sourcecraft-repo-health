export type DocumentationEvidence = {
  label: string;
  path: string;
};

export type DocumentationMetric = {
  key: string;
  rawValue: { present: boolean; path?: string };
  normalizedScore: number;
  weight: number;
  source: string;
  explanation: string;
  evidence: DocumentationEvidence[];
};

export type DocumentationCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: DocumentationMetric[];
};
import { DataStatus } from '@prisma/client';
