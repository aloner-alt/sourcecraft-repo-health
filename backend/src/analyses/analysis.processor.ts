import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalysisRunnerService } from './analysis-runner.service';
import { ANALYSIS_QUEUE, RUN_ANALYSIS_JOB } from './analysis-queue.constants';
import { SCHEDULED_ANALYSIS_SWEEP_JOB } from './analysis-queue.constants';
import { AnalysisQueueService } from './analysis-queue.service';

type AnalysisJob = { analysisId: string };

@Processor(ANALYSIS_QUEUE)
export class AnalysisProcessor extends WorkerHost {
  constructor(
    private readonly runner: AnalysisRunnerService,
    private readonly queue: AnalysisQueueService,
  ) {
    super();
  }

  async process(job: Job<AnalysisJob>): Promise<void> {
    if (job.name === SCHEDULED_ANALYSIS_SWEEP_JOB) {
      await this.queue.runScheduledSweep();
      return;
    }
    if (job.name !== RUN_ANALYSIS_JOB) {
      throw new Error(`Unsupported analysis job: ${job.name}`);
    }
    await this.runner.run(job.data.analysisId);
  }
}
