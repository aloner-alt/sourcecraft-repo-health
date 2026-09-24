import { ServiceUnavailableException } from '@nestjs/common';
import { AnalysisTrigger } from '@prisma/client';
import { Queue } from 'bullmq';
import { AnalysisQueueService } from './analysis-queue.service';
import { AnalysesService } from './analyses.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('AnalysisQueueService', () => {
  const analyses = {
    start: jest.fn(),
    fail: jest.fn(),
  } as unknown as AnalysesService;
  const queue = { add: jest.fn(), getJobCounts: jest.fn(), upsertJobScheduler: jest.fn() } as unknown as Queue;
  const repositories = {
    assertCanAnalyze: jest.fn(),
    syncPublicCatalog: jest.fn(),
    publicRepositoryIds: jest.fn(),
  } as unknown as RepositoriesService;
  const prisma = { analysis: { findFirst: jest.fn() } } as unknown as PrismaService;
  const config = { get: jest.fn((_key: string, fallback: unknown) => fallback) } as unknown as ConfigService;
  const service = new AnalysisQueueService(analyses, queue, repositories, prisma, config);

  beforeEach(() => jest.clearAllMocks());

  it('creates an analysis and enqueues a retryable job', async () => {
    (analyses.start as jest.Mock).mockResolvedValue({
      id: 'analysis-1',
      status: 'QUEUED',
    });
    (queue.add as jest.Mock).mockResolvedValue({ id: 'analysis-1' });

    const result = await service.start('repo-1', AnalysisTrigger.MANUAL, 'user-1');

    expect(result.jobId).toBe('analysis-1');
    expect(queue.add).toHaveBeenCalledWith(
      'run-analysis',
      { analysisId: 'analysis-1' },
      expect.objectContaining({
        jobId: 'analysis-1',
        attempts: 3,
        lifo: true,
      }),
    );
  });

  it('marks the analysis failed when Redis rejects the job', async () => {
    (analyses.start as jest.Mock).mockResolvedValue({ id: 'analysis-1' });
    (queue.add as jest.Mock).mockRejectedValue(new Error('offline'));

    await expect(
      service.start('repo-1', AnalysisTrigger.MANUAL, 'user-1'),
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

  it('registers a periodic public-repository sweep', async () => {
    (queue.upsertJobScheduler as jest.Mock).mockResolvedValue({});
    await service.onApplicationBootstrap();
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      'public-repositories-periodic-analysis',
      { every: 86_400_000 },
      expect.objectContaining({ name: 'scheduled-analysis-sweep' }),
    );
  });
});
