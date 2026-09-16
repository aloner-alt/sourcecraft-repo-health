import { DataStatus } from '@prisma/client';
import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';
import { CiCdCollector } from './cicd.collector';

describe('CiCdCollector', () => {
  const sourceCraft = { listRepositoryCiRuns: jest.fn() } as unknown as SourceCraftClient;
  const collector = new CiCdCollector(sourceCraft);

  beforeEach(() => jest.clearAllMocks());

  it('scores pipeline presence, reliability, and freshness', async () => {
    (sourceCraft.listRepositoryCiRuns as jest.Mock).mockResolvedValue({ runs: [
      { id: '1', slug: '1', status: 'success', dates: { created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-02T00:00:00Z', finished_at: '2026-09-02T00:00:00Z' } },
      { id: '2', slug: '2', status: 'failed', dates: { created_at: '2026-09-03T00:00:00Z', updated_at: '2026-09-03T00:00:00Z' } },
    ] });

    const result = await collector.collect('team', 'demo', new Date('2026-09-16T00:00:00Z'));
    expect(result).toMatchObject({ score: 70, status: DataStatus.AVAILABLE });
  });

  it('returns no data when CI has never run', async () => {
    (sourceCraft.listRepositoryCiRuns as jest.Mock).mockResolvedValue({ runs: [] });
    await expect(collector.collect('team', 'demo')).resolves.toMatchObject({ score: null, status: DataStatus.NO_DATA });
  });
});
