import { Injectable, Logger, OnApplicationBootstrap, ServiceUnavailableException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { AnalysisTrigger } from '@prisma/client';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { AnalysesService } from './analyses.service';
import { PrismaService } from '../database/prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';
import {
  ANALYSIS_QUEUE,
  RUN_ANALYSIS_JOB,
  SCHEDULED_ANALYSIS_SCHEDULER,
  SCHEDULED_ANALYSIS_SWEEP_JOB,
} from './analysis-queue.constants';

@Injectable()
export class AnalysisQueueService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AnalysisQueueService.name);

  constructor(
    private readonly analyses: AnalysesService,
    @InjectQueue(ANALYSIS_QUEUE) private readonly queue: Queue,
    private readonly repositories: RepositoriesService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>('SCHEDULE_ENABLED', 'true') === 'false') return;
    const intervalHours = Number(
      this.config.get<string>('ANALYSIS_INTERVAL_HOURS', '24'),
    );
    try {
      await this.queue.upsertJobScheduler(
        SCHEDULED_ANALYSIS_SCHEDULER,
        { every: intervalHours * 60 * 60 * 1_000 },
        {
          name: SCHEDULED_ANALYSIS_SWEEP_JOB,
          data: {},
          opts: { removeOnComplete: 10, removeOnFail: 50 },
        },
      );
    } catch (error) {
      this.logger.warn(
        `Periodic analysis scheduler is unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async start(
    repositoryId: string,
    trigger: AnalysisTrigger,
    userId?: string,
  ) {
    if (trigger !== AnalysisTrigger.SCHEDULED) {
      if (!userId) throw new ServiceUnavailableException('User context is required.');
      await this.repositories.assertCanAnalyze(userId, repositoryId);
    }
    return this.enqueue(repositoryId, trigger);
  }

  async runScheduledSweep(): Promise<{ queued: number; skipped: number }> {
    try {
      await this.repositories.syncPublicCatalog();
    } catch (error) {
      this.logger.warn(
        `Public catalog refresh failed; continuing with known repositories: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
    const repositoryIds = await this.repositories.publicRepositoryIds();
    let queued = 0;
    let skipped = 0;
    for (const repositoryId of repositoryIds) {
      const active = await this.prisma.analysis.findFirst({
        where: {
          repositoryId,
          status: { in: ['QUEUED', 'COLLECTING', 'CALCULATING'] },
        },
        select: { id: true },
      });
      if (active) {
        skipped += 1;
        continue;
      }
      try {
        await this.enqueue(repositoryId, AnalysisTrigger.SCHEDULED);
        queued += 1;
      } catch (error) {
        skipped += 1;
        this.logger.warn(
          `Scheduled analysis was skipped for ${repositoryId}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    return { queued, skipped };
  }

  private async enqueue(repositoryId: string, trigger: AnalysisTrigger) {
    const analysis = await this.analyses.start(repositoryId, trigger);
    try {
      const job = await this.queue.add(
        RUN_ANALYSIS_JOB,
        { analysisId: analysis.id },
        {
          jobId: analysis.id,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      );
      return { ...analysis, jobId: job.id };
    } catch {
      await this.analyses.fail(
        analysis.id,
        'QUEUE_UNAVAILABLE',
        'Analysis could not be added to the Redis queue.',
      );
      throw new ServiceUnavailableException(
        'Analysis queue is temporarily unavailable.',
      );
    }
  }

  async isReady(): Promise<boolean> {
    await this.queue.getJobCounts();
    return true;
  }
}
