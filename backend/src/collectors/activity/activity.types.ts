import { DataStatus } from '@prisma/client';

export type ActivityMetric = {
  key: string;
  rawValue: Record<string, unknown>;
  normalizedScore: number;
  weight: number;
  status: DataStatus;
  source: string;
  explanation: string;
};

export type ActivityCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: ActivityMetric[];
};
