import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RepositoryVisibility } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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
}
