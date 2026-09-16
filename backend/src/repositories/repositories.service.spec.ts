import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  RepositorySortBy,
  SortOrder,
} from './dto/list-repositories-query.dto';
import { RepositoriesService } from './repositories.service';
import { SourceCraftClient } from '../sourcecraft/sourcecraft.client';

describe('RepositoriesService', () => {
  const repository = {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  };
  const prisma = {
    repository,
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  } as unknown as PrismaService;
  const sourceCraft = {
    getRepository: jest.fn(),
  } as unknown as SourceCraftClient;
  const service = new RepositoriesService(prisma, sourceCraft);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a paginated public ranking ordered by score', async () => {
    repository.count.mockResolvedValue(1);
    repository.findMany.mockResolvedValue([{ id: 'repo-1', latestScore: 82 }]);

    const result = await service.findPublic({
      language: 'TypeScript',
      sortBy: RepositorySortBy.SCORE,
      order: SortOrder.DESC,
      limit: 20,
      offset: 0,
    });

    expect(result.pagination.total).toBe(1);
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ latestScore: 'desc' }, { name: 'asc' }],
        take: 20,
      }),
    );
  });

  it('throws when the repository does not exist', async () => {
    repository.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('imports a SourceCraft repository without inventing unavailable fields', async () => {
    (sourceCraft.getRepository as jest.Mock).mockResolvedValue({
      id: 'source-1',
      name: 'Demo',
      slug: 'demo',
      description: 'Repository description',
      default_branch: 'main',
      organization: { id: 'org-1', slug: 'team' },
      visibility: 'public',
      web_url: 'https://sourcecraft.dev/team/demo',
      last_updated: '2026-09-16T10:00:00Z',
      language: { name: 'TypeScript' },
    });
    repository.upsert.mockResolvedValue({ id: 'repo-1', sourcecraftId: 'source-1' });

    const result = await service.syncFromSourceCraft('team', 'demo');

    expect(result.sourcecraftId).toBe('source-1');
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          primaryLanguage: 'TypeScript',
          sourcecraftId: 'source-1',
        }),
      }),
    );
  });
});
