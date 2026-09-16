import { DataStatus } from '@prisma/client';
import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';
import { IssuesCollector } from './issues.collector';

describe('IssuesCollector', () => {
  const sourceCraft = {
    listRepositoryIssues: jest.fn(),
  } as unknown as SourceCraftClient;
  const collector = new IssuesCollector(sourceCraft);
  const now = new Date('2026-09-16T00:00:00.000Z');

  beforeEach(() => jest.clearAllMocks());

  it('scores issue resolution, freshness, and description coverage', async () => {
    (sourceCraft.listRepositoryIssues as jest.Mock).mockResolvedValue({
      issues: [
        {
          id: '1',
          slug: 'ISSUE-1',
          title: 'Completed',
          description: 'Done',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
          completed_at: '2026-09-02T00:00:00Z',
        },
        {
          id: '2',
          slug: 'ISSUE-2',
          title: 'Fresh',
          description: 'In progress',
          created_at: '2026-09-10T00:00:00Z',
          updated_at: '2026-09-15T00:00:00Z',
        },
        {
          id: '3',
          slug: 'ISSUE-3',
          title: 'Stale',
          created_at: '2026-06-01T00:00:00Z',
          updated_at: '2026-07-01T00:00:00Z',
        },
        {
          id: '4',
          slug: 'ISSUE-4',
          title: 'Also completed',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
          completed_at: '2026-09-02T00:00:00Z',
        },
      ],
    });

    const result = await collector.collect('team', 'demo', now);

    expect(result).toMatchObject({
      status: DataStatus.AVAILABLE,
      score: 50,
      summary: '4 issues analyzed; 2 open and 1 stale.',
    });
    expect(result.metrics[1].evidence).toHaveLength(1);
  });

  it('marks an empty issue tracker as no data', async () => {
    (sourceCraft.listRepositoryIssues as jest.Mock).mockResolvedValue({ issues: [] });

    await expect(collector.collect('team', 'demo', now)).resolves.toMatchObject({
      status: DataStatus.NO_DATA,
      score: null,
      metrics: [],
    });
  });
});
