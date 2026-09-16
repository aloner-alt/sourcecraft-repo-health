import { DataStatus } from '@prisma/client';

export type ActivityCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: Array<{
    key: string;
    rawValue: { lastActivityAt: string; daysSinceLastActivity: number };
    normalizedScore: number;
    weight: number;
    status: DataStatus;
    source: string;
    explanation: string;
  }>;
};
