import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';

export type SecurityCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: Array<{
    key: string;
    rawValue: { present: boolean; path?: string };
    normalizedScore: number | null;
    weight: number;
    status: DataStatus;
    source: string;
    explanation: string;
  }>;
};

@Injectable()
export class SecurityCollector {
  async collect(_org: string, _repo: string): Promise<SecurityCollectionResult> {
    // The public SourceCraft API currently exposes no AppSec/SAST/SCA result
    // endpoint. Security must not be inferred from repository files: the TЗ
    // explicitly requires real AppSec results. Keep the category out of the
    // denominator until such a result is available.
    return {
      score: null,
      status: DataStatus.NO_DATA,
      summary:
        'AppSec SourceCraft results are unavailable; security was not scored and no vulnerability claim was made.',
      metrics: [],
    };
  }
}
