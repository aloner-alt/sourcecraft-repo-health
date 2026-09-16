import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';
import { SecurityCollector } from './security.collector';

describe('SecurityCollector', () => {
  const sourceCraft = { listRepositoryTree: jest.fn() } as unknown as SourceCraftClient;
  const collector = new SecurityCollector(sourceCraft);

  it('scores only verifiable repository security hygiene', async () => {
    (sourceCraft.listRepositoryTree as jest.Mock).mockResolvedValue({ trees: [
      { name: 'SECURITY.md', path: 'SECURITY.md', type: 'file' },
      { name: 'package.json', path: 'package.json', type: 'file' },
      { name: 'pnpm-lock.yaml', path: 'pnpm-lock.yaml', type: 'file' },
    ] });
    await expect(collector.collect('team', 'demo')).resolves.toMatchObject({ score: 85, summary: expect.stringContaining('vulnerabilities were not assessed') });
  });
});
