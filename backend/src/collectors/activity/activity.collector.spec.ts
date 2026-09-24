import { DataStatus } from '@prisma/client';
import { ActivityCollector } from './activity.collector';

describe('ActivityCollector', () => {
  const now = new Date('2026-09-16T00:00:00Z');
  it.each([
    ['2026-09-15T00:00:00Z', 100], ['2026-08-20T00:00:00Z', 80],
    ['2026-07-01T00:00:00Z', 60], ['2026-04-01T00:00:00Z', 30], ['2025-01-01T00:00:00Z', 0],
  ])('scores repository recency for %s', async (date, expected) => {
    const result = await new ActivityCollector().collect('', '', new Date(date), now);
    expect(result.score).toBe(expected);
  });
  it('collects confirmed pull request and release endpoints without inventing unavailable commits', async () => {
    const api = {
      listRepositoryPullRequests: jest.fn().mockResolvedValue({ pulls: [{ id: 'p1', status: 'merged', updated_at: '2026-09-10T00:00:00Z' }] }),
      listRepositoryReleases: jest.fn().mockResolvedValue({ releases: [{ id: 'r1', status: 'published', released_at: '2026-09-01T00:00:00Z' }] }),
    } as any;
    const result = await new ActivityCollector(api).collect('team', 'repo', null, now);
    expect(result.status).toBe(DataStatus.AVAILABLE);
    expect(result.metrics.map((m) => m.key)).toEqual(['pull_requests_90d', 'releases_180d']);
    expect(result.score).toBe(15.63);
  });
  it('returns no data without a timestamp or optional endpoint client', async () => {
    await expect(new ActivityCollector().collect('', '', null, now)).resolves.toMatchObject({ score: null, status: DataStatus.NO_DATA, metrics: [] });
  });
});
