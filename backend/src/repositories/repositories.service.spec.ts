import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  RepositorySortBy,
  SortOrder,
} from './dto/list-repositories-query.dto';
import { RepositoriesService } from './repositories.service';
import { SourceCraftClient } from '../sourcecraft/sourcecraft.client';
import { ConfigService } from '@nestjs/config';

describe('RepositoriesService', () => {
  const repository = {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  };
  const analysis = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  };
  const repositoryAccess = { upsert: jest.fn(), findUnique: jest.fn() };
  const prisma = {
    repository,
    repositoryAccess,
    analysis,
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  } as unknown as PrismaService;
  const sourceCraft = {
    getRepository: jest.fn(),
  } as unknown as SourceCraftClient;
  const config = { get: jest.fn().mockReturnValue('') } as unknown as ConfigService;
  const service = new RepositoriesService(prisma, sourceCraft, config);

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

    const result = await service.syncFromSourceCraft('team', 'demo', 'user-1');

    expect(result.sourcecraftId).toBe('source-1');
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          primaryLanguage: 'TypeScript',
          sourcecraftId: 'source-1',
        }),
      }),
    );
    expect(repositoryAccess.upsert).toHaveBeenCalled();
  });

  it('rejects private repositories without a verified SourceCraft account link', async () => {
    (sourceCraft.getRepository as jest.Mock).mockResolvedValue({
      id: 'private-1',
      name: 'Private',
      slug: 'private',
      default_branch: 'main',
      organization: { id: 'org-1', slug: 'team' },
      visibility: 'private',
      web_url: 'https://sourcecraft.dev/team/private',
    });

    await expect(
      service.syncFromSourceCraft('team', 'private', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('requires workspace access before a manual analysis', async () => {
    repositoryAccess.findUnique.mockResolvedValue(null);
    await expect(service.assertCanAnalyze('user-1', 'repo-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns the latest completed health breakdown', async () => {
    repository.findUnique.mockResolvedValue({ id: 'repo-1' });
    analysis.findFirst.mockResolvedValue({
      id: 'analysis-1',
      score: 75,
      potentialScore: 90,
      dataCoverage: 30,
      methodology: 'v1',
      completedAt: new Date('2026-09-16T12:00:00Z'),
      categories: [{ category: 'DOCUMENTATION', score: 75 }],
    });

    const result = await service.getHealth('repo-1');

    expect(result).toMatchObject({
      analysisId: 'analysis-1',
      score: 75,
      potentialScore: 90,
    });
    expect(analysis.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { repositoryId: 'repo-1', status: 'COMPLETED' },
      }),
    );
  });

  it('returns score history in chronological order', async () => {
    repository.findUnique.mockResolvedValue({ id: 'repo-1' });
    analysis.findMany.mockResolvedValue([
      { id: 'new', score: 80 },
      { id: 'old', score: 60 },
    ]);

    const result = await service.getScoreHistory('repo-1', 30);

    expect(result.items.map((item) => item.id)).toEqual(['old', 'new']);
    expect(analysis.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 30 }),
    );
  });

  it('reports when a repository has no completed analysis', async () => {
    repository.findUnique.mockResolvedValue({ id: 'repo-1' });
    analysis.findFirst.mockResolvedValue(null);

    await expect(service.getMetrics('repo-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
