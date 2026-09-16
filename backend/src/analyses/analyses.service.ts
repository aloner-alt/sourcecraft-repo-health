import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnalysisStatus, AnalysisTrigger } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

const allowedTransitions: Record<AnalysisStatus, AnalysisStatus[]> = {
  QUEUED: [AnalysisStatus.COLLECTING, AnalysisStatus.FAILED],
  COLLECTING: [AnalysisStatus.CALCULATING, AnalysisStatus.FAILED],
  CALCULATING: [AnalysisStatus.COMPLETED, AnalysisStatus.FAILED],
  COMPLETED: [],
  FAILED: [],
};

type CompleteAnalysisInput = {
  score: number;
  potentialScore?: number;
  dataCoverage: number;
};

@Injectable()
export class AnalysesService {
  constructor(private readonly prisma: PrismaService) {}

  async start(repositoryId: string, trigger: AnalysisTrigger) {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { id: true },
    });

    if (!repository) {
      throw new NotFoundException(`Repository ${repositoryId} was not found.`);
    }

    return this.prisma.analysis.create({
      data: { repositoryId, trigger, status: AnalysisStatus.QUEUED },
    });
  }

  async findById(id: string) {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id },
      include: {
        repository: true,
        categories: { include: { metrics: { include: { evidence: true } } } },
        recommendations: { include: { evidence: true } },
      },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis ${id} was not found.`);
    }

    return analysis;
  }

  markCollecting(id: string) {
    return this.transition(id, AnalysisStatus.COLLECTING, {
      startedAt: new Date(),
    });
  }

  markCalculating(id: string) {
    return this.transition(id, AnalysisStatus.CALCULATING);
  }

  async complete(id: string, result: CompleteAnalysisInput) {
    const analysis = await this.requireTransition(id, AnalysisStatus.COMPLETED);
    const completedAt = new Date();

    const [, completed] = await this.prisma.$transaction([
      this.prisma.repository.update({
        where: { id: analysis.repositoryId },
        data: {
          latestScore: result.score,
          latestPotentialScore: result.potentialScore,
          latestDataCoverage: result.dataCoverage,
          lastAnalyzedAt: completedAt,
        },
      }),
      this.prisma.analysis.update({
        where: { id },
        data: {
          status: AnalysisStatus.COMPLETED,
          score: result.score,
          potentialScore: result.potentialScore,
          dataCoverage: result.dataCoverage,
          completedAt,
        },
      }),
    ]);

    return completed;
  }

  fail(id: string, errorCode: string, errorMessage: string) {
    return this.transition(id, AnalysisStatus.FAILED, {
      errorCode,
      errorMessage,
      completedAt: new Date(),
    });
  }

  private async transition(
    id: string,
    target: AnalysisStatus,
    data: Record<string, unknown> = {},
  ) {
    await this.requireTransition(id, target);
    return this.prisma.analysis.update({
      where: { id },
      data: { ...data, status: target },
    });
  }

  private async requireTransition(id: string, target: AnalysisStatus) {
    const analysis = await this.prisma.analysis.findUnique({ where: { id } });
    if (!analysis) {
      throw new NotFoundException(`Analysis ${id} was not found.`);
    }
    if (!allowedTransitions[analysis.status].includes(target)) {
      throw new BadRequestException(
        `Analysis cannot transition from ${analysis.status} to ${target}.`,
      );
    }
    return analysis;
  }
}
