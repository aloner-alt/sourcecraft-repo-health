import { SourceCraftClient } from '../sourcecraft/sourcecraft.client';
import { RepositoryTreeProvider } from './repository-tree.provider';

describe('RepositoryTreeProvider', () => {
  it('paginates once and shares the result between collectors', async () => {
    const sourceCraft = { listRepositoryTree: jest.fn() } as unknown as SourceCraftClient;
    (sourceCraft.listRepositoryTree as jest.Mock)
      .mockResolvedValueOnce({ trees: [{ name: 'a', path: 'a', type: 'file' }], next_page_token: 'next' })
      .mockResolvedValueOnce({ trees: [{ name: 'b', path: 'b', type: 'file' }] });
    const provider = new RepositoryTreeProvider(sourceCraft);

    const [first, second] = await Promise.all([
      provider.get('team', 'demo'),
      provider.get('team', 'demo'),
    ]);

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(sourceCraft.listRepositoryTree).toHaveBeenCalledTimes(2);
    expect(sourceCraft.listRepositoryTree).toHaveBeenNthCalledWith(
      1,
      'team',
      'demo',
      { pageSize: 500, pageToken: undefined, recursive: true },
    );
  });

  it('processes a large repository with more than 10,000 tracked files', async () => {
    const sourceCraft = { listRepositoryTree: jest.fn() } as unknown as SourceCraftClient;
    const pageSize = 500;
    const totalFiles = 10_500;
    for (let page = 0; page < totalFiles / pageSize; page += 1) {
      (sourceCraft.listRepositoryTree as jest.Mock).mockResolvedValueOnce({
        trees: Array.from({ length: pageSize }, (_, index) => ({
          name: `file-${page * pageSize + index}.ts`,
          path: `src/file-${page * pageSize + index}.ts`,
          type: 'file',
        })),
        ...(page < totalFiles / pageSize - 1
          ? { next_page_token: `page-${page + 1}` }
          : {}),
      });
    }
    const provider = new RepositoryTreeProvider(sourceCraft);

    const result = await provider.get('large-team', 'large-repo');

    expect(result).toHaveLength(totalFiles);
    expect(sourceCraft.listRepositoryTree).toHaveBeenCalledTimes(21);
  });
});
