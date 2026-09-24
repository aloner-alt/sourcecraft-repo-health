import { DataStatus } from '@prisma/client';
import { ActivityCollector } from './activity.collector';
import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';

describe('ActivityCollector', () => {
  const sourceCraft = {
    listRepositoryContributors: jest.fn(),
    listRepositoryPullRequests: jest.fn(),
    listRepositoryReleases: jest.fn(),
  } as unknown as SourceCraftClient;
  const collector = new ActivityCollector(sourceCraft);
  const now = new Date('2026-09-16T00:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    (sourceCraft.listRepositoryContributors as jest.Mock).mockRejectedValue(new Error('offline'));
    (sourceCraft.listRepositoryPullRequests as jest.Mock).mockRejectedValue(new Error('offline'));
    (sourceCraft.listRepositoryReleases as jest.Mock).mockRejectedValue(new Error('offline'));
  });

  it.each([
    ['2026-09-15T00:00:00Z', 100],
    ['2026-08-20T00:00:00Z', 80],
    ['2026-07-01T00:00:00Z', 60],
    ['2026-04-01T00:00:00Z', 30],
    ['2025-01-01T00:00:00Z', 0],
  ])('scores repository recency for %s', async (date, expected) => {
    await expect(collector.collect('repo-1', 'team', 'demo', new Date(date), now)).resolves.toMatchObject({ score: expected });
  });

  it('returns no data when every activity source is unavailable', async () => {
    await expect(collector.collect('repo-1', 'team', 'demo', null, now)).resolves.toMatchObject({
      score: null,
      status: DataStatus.NO_DATA,
      metrics: [],
    });
  });

  it('combines contributors, merge requests, releases, and recency', async () => {
    (sourceCraft.listRepositoryContributors as jest.Mock).mockResolvedValue({ contributors: Array.from({ length: 5 }, (_, index) => ({ id: String(index) })) });
    (sourceCraft.listRepositoryPullRequests as jest.Mock).mockResolvedValue({ pull_requests: [{ id: 'pr-1', slug: '1', title: 'Done', status: 'merged', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-10T00:00:00Z' }] });
    (sourceCraft.listRepositoryReleases as jest.Mock).mockResolvedValue({ releases: [{ id: 'release-1', tag: 'v1', title: 'v1', status: 'published', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', released_at: '2026-09-01T00:00:00Z' }] });

    const result = await collector.collect('repo-1', 'team', 'demo', new Date('2026-09-15T00:00:00Z'), now);

    expect(result.metrics.map((metric) => metric.key)).toEqual([
      'repository_recency', 'contributor_depth', 'pull_request_flow', 'release_freshness',
    ]);
    expect(result.score).toBeGreaterThan(80);
  });
});
