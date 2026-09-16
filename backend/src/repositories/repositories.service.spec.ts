import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  RepositorySortBy,
  SortOrder,
} from './dto/list-repositories-query.dto';
import { RepositoriesService } from './repositories.service';

describe('RepositoriesService', () => {
  const repository = {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };
  const prisma = {
    repository,
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  } as unknown as PrismaService;
  const service = new RepositoriesService(prisma);

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
});
