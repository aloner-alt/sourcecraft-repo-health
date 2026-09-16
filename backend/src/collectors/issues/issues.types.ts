import { DataStatus } from '@prisma/client';

export type IssueEvidence = {
  label: string;
  value: Record<string, string>;
};

export type IssueMetric = {
  key: string;
  rawValue: Record<string, number>;
  normalizedScore: number | null;
  weight: number;
  status: DataStatus;
  source: string;
  explanation: string;
  evidence: IssueEvidence[];
};

export type IssuesCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: IssueMetric[];
};
