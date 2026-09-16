import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { AnalysisTrigger } from '@prisma/client';
import { Queue } from 'bullmq';
import { AnalysesService } from './analyses.service';
import { ANALYSIS_QUEUE, RUN_ANALYSIS_JOB } from './analysis-queue.constants';

@Injectable()
export class AnalysisQueueService {
  constructor(
    private readonly analyses: AnalysesService,
    @InjectQueue(ANALYSIS_QUEUE) private readonly queue: Queue,
  ) {}

  async start(repositoryId: string, trigger: AnalysisTrigger) {
    const analysis = await this.analyses.start(repositoryId, trigger);
    try {
      const job = await this.queue.add(
        RUN_ANALYSIS_JOB,
        { analysisId: analysis.id },
        {
          jobId: analysis.id,
          attempts: 1,
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
