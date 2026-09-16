import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';
import { DocumentationCollector } from './documentation.collector';

describe('DocumentationCollector', () => {
  const sourceCraft = {
    listRepositoryTree: jest.fn(),
  } as unknown as SourceCraftClient;
  const collector = new DocumentationCollector(sourceCraft);

  beforeEach(() => jest.clearAllMocks());

  it('scores documentation files and follows pagination', async () => {
    (sourceCraft.listRepositoryTree as jest.Mock)
      .mockResolvedValueOnce({
        trees: [
          { name: 'README.md', path: 'README.md', type: 'file' },
          { name: 'LICENSE', path: 'LICENSE', type: 'file' },
        ],
        next_page_token: 'page-2',
      })
      .mockResolvedValueOnce({
        trees: [
          {
            name: 'CONTRIBUTING.md',
            path: 'docs/CONTRIBUTING.md',
            type: 'file',
          },
        ],
      });

    const result = await collector.collect('team', 'demo');

    expect(result.score).toBe(85);
    expect(result.summary).toBe('3 of 4 baseline documentation files found.');
    expect(result.metrics.find((metric) => metric.key === 'codeowners')).toMatchObject({
      normalizedScore: 0,
      rawValue: { present: false },
    });
    expect(sourceCraft.listRepositoryTree).toHaveBeenNthCalledWith(
      2,
      'team',
      'demo',
      expect.objectContaining({ pageToken: 'page-2' }),
    );
  });

  it('returns zero for an empty repository tree', async () => {
    (sourceCraft.listRepositoryTree as jest.Mock).mockResolvedValue({ trees: [] });

    await expect(collector.collect('team', 'empty')).resolves.toMatchObject({
      score: 0,
      summary: '0 of 4 baseline documentation files found.',
    });
  });
});
