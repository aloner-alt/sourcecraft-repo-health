import { SecurityCollector } from './security.collector';
import { RepositoryTreeProvider } from '../repository-tree.provider';

describe('SecurityCollector', () => {
  const tree = { get: jest.fn() } as unknown as RepositoryTreeProvider;
  const collector = new SecurityCollector(tree);

  it('scores only verifiable repository security hygiene', async () => {
    (tree.get as jest.Mock).mockResolvedValue([
      { name: 'SECURITY.md', path: 'SECURITY.md', type: 'file' },
      { name: 'package.json', path: 'package.json', type: 'file' },
      { name: 'pnpm-lock.yaml', path: 'pnpm-lock.yaml', type: 'file' },
    ]);
    await expect(collector.collect('team', 'demo')).resolves.toMatchObject({ score: 85, summary: expect.stringContaining('vulnerabilities were not assessed') });
  });
});
