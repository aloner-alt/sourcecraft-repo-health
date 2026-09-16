import { DocumentationCollector } from './documentation.collector';
import { RepositoryTreeProvider } from '../repository-tree.provider';

describe('DocumentationCollector', () => {
  const tree = { get: jest.fn() } as unknown as RepositoryTreeProvider;
  const collector = new DocumentationCollector(tree);

  beforeEach(() => jest.clearAllMocks());

  it('scores documentation files and follows pagination', async () => {
    (tree.get as jest.Mock).mockResolvedValue([
          { name: 'README.md', path: 'README.md', type: 'file' },
          { name: 'LICENSE', path: 'LICENSE', type: 'file' },
          {
            name: 'CONTRIBUTING.md',
            path: 'docs/CONTRIBUTING.md',
            type: 'file',
          },
        ]);

    const result = await collector.collect('team', 'demo');

    expect(result.score).toBe(85);
    expect(result.summary).toBe('3 of 4 baseline documentation files found.');
    expect(result.metrics.find((metric) => metric.key === 'codeowners')).toMatchObject({
      normalizedScore: 0,
      rawValue: { present: false },
    });
    expect(tree.get).toHaveBeenCalledWith('team', 'demo');
  });

  it('returns zero for an empty repository tree', async () => {
    (tree.get as jest.Mock).mockResolvedValue([]);

    await expect(collector.collect('team', 'empty')).resolves.toMatchObject({
      score: 0,
      summary: '0 of 4 baseline documentation files found.',
    });
  });
});
