import { DataStatus } from '@prisma/client';

export type SecurityMetric = {
  key: string;
  rawValue: Record<string, unknown>;
  normalizedScore: number;
  weight: number;
  status: DataStatus;
  source: string;
  explanation: string;
};

export type SecurityCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: SecurityMetric[];
};
