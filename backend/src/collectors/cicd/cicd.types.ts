import { DataStatus } from '@prisma/client';

export type CiCdMetric = {
  key: string;
  rawValue: Record<string, number | string | null>;
  normalizedScore: number;
  weight: number;
  status: DataStatus;
  source: string;
  explanation: string;
};

export type CiCdCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: CiCdMetric[];
};
