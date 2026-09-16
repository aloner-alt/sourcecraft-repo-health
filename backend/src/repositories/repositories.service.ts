import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async syncFromSourceCraft(
    organizationSlug: string,
    repositorySlug: string,
  ) {
    const source = await this.sourceCraft.getRepository(
      organizationSlug,
      repositorySlug,
    );
    const visibility = this.mapVisibility(source.visibility);
    const data = {
      ownerSlug: source.organization.slug,
      slug: source.slug,
      name: source.name,
      description: source.description ?? null,
      webUrl: source.web_url,
      visibility,
      primaryLanguage: source.language?.name ?? null,
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
      where: { id },
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
      where: { id },
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
