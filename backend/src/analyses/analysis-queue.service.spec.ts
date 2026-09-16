import { ServiceUnavailableException } from '@nestjs/common';
import { AnalysisTrigger } from '@prisma/client';
import { Queue } from 'bullmq';
import { AnalysisQueueService } from './analysis-queue.service';
import { AnalysesService } from './analyses.service';

describe('AnalysisQueueService', () => {
  const analyses = {
    start: jest.fn(),
    fail: jest.fn(),
  } as unknown as AnalysesService;
  const queue = { add: jest.fn(), getJobCounts: jest.fn() } as unknown as Queue;
  const service = new AnalysisQueueService(analyses, queue);

  beforeEach(() => jest.clearAllMocks());

  it('creates an analysis and enqueues one non-retrying job', async () => {
    (analyses.start as jest.Mock).mockResolvedValue({
      id: 'analysis-1',
      status: 'QUEUED',
    });
    (queue.add as jest.Mock).mockResolvedValue({ id: 'analysis-1' });

    const result = await service.start('repo-1', AnalysisTrigger.MANUAL);

    expect(result.jobId).toBe('analysis-1');
    expect(queue.add).toHaveBeenCalledWith(
      'run-analysis',
      { analysisId: 'analysis-1' },
      expect.objectContaining({ jobId: 'analysis-1', attempts: 1 }),
    );
  });

  it('marks the analysis failed when Redis rejects the job', async () => {
    (analyses.start as jest.Mock).mockResolvedValue({ id: 'analysis-1' });
    (queue.add as jest.Mock).mockRejectedValue(new Error('offline'));

    await expect(
      service.start('repo-1', AnalysisTrigger.MANUAL),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(analyses.fail).toHaveBeenCalledWith(
      'analysis-1',
      'QUEUE_UNAVAILABLE',
      expect.any(String),
    );
  });

  it('reports Redis readiness', async () => {
    (queue.getJobCounts as jest.Mock).mockResolvedValue({ wait: 0 });
    await expect(service.isReady()).resolves.toBe(true);
  });
});
