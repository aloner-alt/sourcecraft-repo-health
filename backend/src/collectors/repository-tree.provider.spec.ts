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
});
