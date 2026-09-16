import { DataStatus } from '@prisma/client';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  const service = new RecommendationsService();

  it('generates ordered recommendations with explainable score deltas', () => {
    const result = service.build(
      {
        score: 40,
        summary: '',
        metrics: [
          {
            key: 'readme',
            rawValue: { present: true },
            normalizedScore: 100,
            weight: 0.4,
            source: '',
            explanation: '',
            evidence: [],
          },
          {
            key: 'license',
            rawValue: { present: false },
            normalizedScore: 0,
            weight: 0.25,
            source: '',
            explanation: '',
            evidence: [],
          },
        ],
      },
      {
        score: 50,
        status: DataStatus.AVAILABLE,
        summary: '',
        metrics: [
          {
            key: 'open_issue_freshness',
            rawValue: { fresh: 1, open: 2 },
            normalizedScore: 50,
            weight: 0.35,
            status: DataStatus.AVAILABLE,
            source: '',
            explanation: '1 stale issue.',
            evidence: [],
          },
        ],
      },
      {
        score: null,
        status: DataStatus.NO_DATA,
        summary: '',
        metrics: [],
      },
      {
        score: null,
        status: DataStatus.NO_DATA,
        summary: '',
        metrics: [],
      },
      {
        score: 100,
        status: DataStatus.AVAILABLE,
        summary: '',
        metrics: [],
      },
      {
        score: 100,
        status: DataStatus.AVAILABLE,
        summary: '',
        metrics: [],
      },
      0.3,
    );

    expect(result.map((item) => item.title)).toEqual([
      'Add a license',
      'Review stale issues',
    ]);
    expect(result[0]).toMatchObject({ expectedScoreDelta: 12.5, priority: 'HIGH' });
    expect(result[1]).toMatchObject({ expectedScoreDelta: 8.75, priority: 'HIGH' });
  });
});
