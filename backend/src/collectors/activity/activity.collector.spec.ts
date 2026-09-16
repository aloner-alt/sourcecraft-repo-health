import { DataStatus } from '@prisma/client';
import { ActivityCollector } from './activity.collector';

describe('ActivityCollector', () => {
  const collector = new ActivityCollector();
  const now = new Date('2026-09-16T00:00:00Z');

  it.each([
    ['2026-09-15T00:00:00Z', 100],
    ['2026-08-20T00:00:00Z', 80],
    ['2026-07-01T00:00:00Z', 60],
    ['2026-04-01T00:00:00Z', 30],
    ['2025-01-01T00:00:00Z', 0],
  ])('scores repository recency for %s', (date, expected) => {
    expect(collector.collect(new Date(date), now).score).toBe(expected);
  });

  it('returns no data without a timestamp', () => {
    expect(collector.collect(null, now)).toMatchObject({
      score: null,
      status: DataStatus.NO_DATA,
      metrics: [],
    });
  });
});
