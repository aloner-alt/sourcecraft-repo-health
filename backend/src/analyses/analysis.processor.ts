import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalysisRunnerService } from './analysis-runner.service';
import { ANALYSIS_QUEUE, RUN_ANALYSIS_JOB } from './analysis-queue.constants';

type AnalysisJob = { analysisId: string };

@Processor(ANALYSIS_QUEUE)
export class AnalysisProcessor extends WorkerHost {
  constructor(private readonly runner: AnalysisRunnerService) {
    super();
  }

  async process(job: Job<AnalysisJob>): Promise<void> {
    if (job.name !== RUN_ANALYSIS_JOB) {
      throw new Error(`Unsupported analysis job: ${job.name}`);
    }
    await this.runner.run(job.data.analysisId);
  }
}
