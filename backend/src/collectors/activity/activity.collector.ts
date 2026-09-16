import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { ActivityCollectionResult } from './activity.types';

@Injectable()
export class ActivityCollector {
  collect(
    lastActivityAt: Date | null,
    now = new Date(),
  ): ActivityCollectionResult {
    if (!lastActivityAt) {
      return {
        score: null,
        status: DataStatus.NO_DATA,
        summary: 'SourceCraft did not provide a last activity timestamp.',
        metrics: [],
      };
    }

    const daysSinceLastActivity = Math.max(
      0,
      Math.floor(
        (now.getTime() - lastActivityAt.getTime()) / (24 * 60 * 60 * 1_000),
      ),
    );
    const score = this.scoreRecency(daysSinceLastActivity);

    return {
      score,
      status: DataStatus.AVAILABLE,
      summary: `Last repository activity was ${daysSinceLastActivity} days ago.`,
      metrics: [
        {
          key: 'repository_recency',
          rawValue: {
            lastActivityAt: lastActivityAt.toISOString(),
            daysSinceLastActivity,
          },
          normalizedScore: score,
          weight: 1,
          status: DataStatus.AVAILABLE,
          source: 'sourcecraft.repository.last_updated',
          explanation:
            'Recency score: 100 up to 7 days, 80 up to 30, 60 up to 90, 30 up to 180, then 0.',
        },
      ],
    };
  }

  private scoreRecency(days: number): number {
    if (days <= 7) return 100;
    if (days <= 30) return 80;
    if (days <= 90) return 60;
    if (days <= 180) return 30;
    return 0;
  }
}
