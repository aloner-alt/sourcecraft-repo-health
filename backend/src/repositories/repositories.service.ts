import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalysisStatus,
  Prisma,
  RepositoryVisibility,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SourceCraftClient } from '../sourcecraft/sourcecraft.client';
import {
  ListRepositoriesQueryDto,
  RepositorySortBy,
} from './dto/list-repositories-query.dto';

const repositoryListSelect = {
  id: true,
  sourcecraftId: true,
  ownerSlug: true,
  slug: true,
  name: true,
  description: true,
  webUrl: true,
  primaryLanguage: true,
  likesCount: true,
  lastActivityAt: true,
  latestScore: true,
  latestPotentialScore: true,
  latestDataCoverage: true,
  lastAnalyzedAt: true,
} satisfies Prisma.RepositorySelect;

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sourceCraft: SourceCraftClient,
    private readonly config: ConfigService,
  ) {}

  async syncFromSourceCraft(
    organizationSlug: string,
    repositorySlug: string,
    userId: string,
  ) {
    const source = await this.sourceCraft.getRepository(
      organizationSlug,
      repositorySlug,
    );
    if (source.visibility !== 'public') {
      throw new ForbiddenException(
        'Private and internal repositories require a verified SourceCraft account link. This deployment accepts public repositories only.',
      );
    }
    const repository = await this.upsertSourceRepository(source);
    await this.prisma.repositoryAccess.upsert({
      where: { userId_repositoryId: { userId, repositoryId: repository.id } },
      create: { userId, repositoryId: repository.id },
      update: {},
    });
    return repository;
  }

  async syncPublicCatalog(): Promise<{ organizations: number; repositories: number }> {
    const organizations = new Set<string>();
    const seen = new Set<string>();
    let repositories = 0;
    let pageToken: string | undefined;
    const maxPages = this.config.get<number>('SOURCECRAFT_CATALOG_MAX_PAGES', 100);

    for (let page = 0; page < maxPages; page += 1) {
      const result = await this.sourceCraft.discoverPublicRepositories(
        100,
        pageToken,
      );
      for (const source of result.repositories) {
        if (source.visibility !== 'public' || seen.has(source.id)) continue;
        seen.add(source.id);
        organizations.add(source.organization.slug);
        await this.upsertSourceRepository(source);
        repositories += 1;
      }
      pageToken = result.next_page_token;
      if (!pageToken) break;
    }

    return { organizations: organizations.size, repositories };
  }

  async syncMineFromSourceCraft(userId: string) {
    let pageToken: string | undefined;
    const importedIds: string[] = [];

    for (let page = 0; page < 100; page += 1) {
      const result = await this.sourceCraft.listMyRepositories(100, pageToken);
      for (const source of result.repositories.filter(
        (repository) => repository.visibility === 'public',
      )) {
        const repository = await this.upsertSourceRepository(source);
        await this.prisma.repositoryAccess.upsert({
          where: {
            userId_repositoryId: {
              userId,
              repositoryId: repository.id,
            },
          },
          create: { userId, repositoryId: repository.id },
          update: {},
        });
        importedIds.push(repository.id);
      }
      pageToken = result.next_page_token;
      if (!pageToken) break;
    }

    return {
      imported: new Set(importedIds).size,
      items: await this.findMine(userId),
    };
  }

  async findMine(userId: string) {
    return this.prisma.repository.findMany({
      where: { accesses: { some: { userId } } },
      select: repositoryListSelect,
      orderBy: [{ lastAnalyzedAt: 'desc' }, { name: 'asc' }],
    });
  }

  async publicRepositoryIds(): Promise<string[]> {
    const repositories = await this.prisma.repository.findMany({
      where: { visibility: RepositoryVisibility.PUBLIC },
      select: { id: true },
    });
    return repositories.map((repository) => repository.id);
  }

  async assertCanAnalyze(userId: string, repositoryId: string): Promise<void> {
    const access = await this.prisma.repositoryAccess.findUnique({
      where: { userId_repositoryId: { userId, repositoryId } },
      select: { id: true },
    });
    if (!access) {
      throw new ForbiddenException(
        'Import this repository into your workspace before starting an analysis.',
      );
    }
  }

  private async upsertSourceRepository(source: Awaited<ReturnType<SourceCraftClient['getRepository']>>) {
    const visibility = this.mapVisibility(source.visibility);
    const data = {
      ownerSlug: source.organization.slug,
      slug: source.slug,
      name: source.name,
      description: source.description ?? null,
      webUrl: source.web_url,
      visibility,
      primaryLanguage: source.language?.name ?? null,
      likesCount: this.likesCount(source),
      lastActivityAt: source.last_updated
        ? new Date(source.last_updated)
        : null,
      lastCollectedAt: new Date(),
    };

    return this.prisma.repository.upsert({
      where: { sourcecraftId: source.id },
      create: { sourcecraftId: source.id, ...data },
      update: data,
      select: repositoryListSelect,
    });
  }

  private likesCount(
    source: Awaited<ReturnType<SourceCraftClient['getRepository']>>,
  ): number {
    const likes = source.rating?.reaction_counts?.find(
      (reaction) => reaction.type === 'positive_low',
    )?.count;
    if (!likes) return 0;
    const parsed = Number(likes);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
  }

  async findPublic(query: ListRepositoriesQueryDto) {
    const where: Prisma.RepositoryWhereInput = {
      visibility: RepositoryVisibility.PUBLIC,
      ...(query.language
        ? {
            primaryLanguage: {
              equals: query.language,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.repository.count({ where }),
      this.prisma.repository.findMany({
        where,
        select: repositoryListSelect,
        orderBy: this.getOrderBy(query),
        skip: query.offset,
        take: query.limit,
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  }

  async findById(id: string) {
    const repository = await this.prisma.repository.findUnique({
      where: { id, visibility: RepositoryVisibility.PUBLIC },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            categories: { orderBy: { category: 'asc' } },
            recommendations: { orderBy: { priority: 'asc' } },
          },
        },
      },
    });

    if (!repository) {
      throw new NotFoundException(`Repository ${id} was not found.`);
    }

    return repository;
  }

  async getHealth(id: string) {
    const analysis = await this.findLatestCompletedAnalysis(id, {
      categories: {
        orderBy: { category: 'asc' },
        select: {
          category: true,
          score: true,
          weight: true,
          status: true,
          summary: true,
        },
      },
    });

    return {
      analysisId: analysis.id,
      score: analysis.score,
      potentialScore: analysis.potentialScore,
      dataCoverage: analysis.dataCoverage,
      methodology: analysis.methodology,
      completedAt: analysis.completedAt,
      categories: analysis.categories,
    };
  }

  async getMetrics(id: string) {
    const analysis = await this.findLatestCompletedAnalysis(id, {
      categories: {
        orderBy: { category: 'asc' },
        include: {
          metrics: {
            orderBy: { key: 'asc' },
            include: { evidence: true },
          },
        },
      },
    });

    return { analysisId: analysis.id, categories: analysis.categories };
  }

  async getRecommendations(id: string) {
    const analysis = await this.findLatestCompletedAnalysis(id, {
      recommendations: {
        orderBy: [{ priority: 'asc' }, { expectedScoreDelta: 'desc' }],
        include: { evidence: true },
      },
    });

    return {
      analysisId: analysis.id,
      potentialScore: analysis.potentialScore,
      items: analysis.recommendations,
    };
  }

  async getScoreHistory(id: string, limit: number) {
    await this.requireRepository(id);
    const items = await this.prisma.analysis.findMany({
      where: {
        repositoryId: id,
        status: AnalysisStatus.COMPLETED,
      },
      select: {
        id: true,
        score: true,
        potentialScore: true,
        dataCoverage: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    return { items: items.reverse() };
  }

  private async findLatestCompletedAnalysis<
    T extends Prisma.AnalysisInclude,
  >(repositoryId: string, include: T) {
    await this.requireRepository(repositoryId);
    const analysis = await this.prisma.analysis.findFirst({
      where: { repositoryId, status: AnalysisStatus.COMPLETED },
      include,
      orderBy: { completedAt: 'desc' },
    });

    if (!analysis) {
      throw new NotFoundException(
        `Repository ${repositoryId} has no completed analysis.`,
      );
    }

    return analysis as Prisma.AnalysisGetPayload<{ include: T }>;
  }

  private async requireRepository(id: string): Promise<void> {
    const repository = await this.prisma.repository.findUnique({
      where: { id, visibility: RepositoryVisibility.PUBLIC },
      select: { id: true },
    });
    if (!repository) {
      throw new NotFoundException(`Repository ${id} was not found.`);
    }
  }

  private getOrderBy(
    query: ListRepositoriesQueryDto,
  ): Prisma.RepositoryOrderByWithRelationInput[] {
    const direction = query.order;

    switch (query.sortBy) {
      case RepositorySortBy.LIKES:
        return [{ likesCount: direction }, { name: 'asc' }];
      case RepositorySortBy.LAST_ACTIVITY:
        return [{ lastActivityAt: direction }, { name: 'asc' }];
      case RepositorySortBy.SCORE:
      default:
        return [{ latestScore: direction }, { name: 'asc' }];
    }
  }

  private mapVisibility(
    visibility: 'public' | 'internal' | 'private',
  ): RepositoryVisibility {
    const values = {
      public: RepositoryVisibility.PUBLIC,
      internal: RepositoryVisibility.INTERNAL,
      private: RepositoryVisibility.PRIVATE,
    } as const;

    return values[visibility];
  }
}
