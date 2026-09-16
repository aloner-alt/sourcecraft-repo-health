import { HealthCategory } from './scoring.constants';

export type CategoryScoreResult = {
  category: HealthCategory;
  score: number | null;
  weight: number;
  status: 'AVAILABLE' | 'NO_DATA';
};

export type HealthScoreResult = {
  score: number | null;
  dataCoverage: number;
  availableWeight: number;
  categories: CategoryScoreResult[];
};
