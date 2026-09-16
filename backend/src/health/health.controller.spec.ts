import { HealthController } from './health.controller';
import { PrismaService } from '../database/prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { AnalysisQueueService } from '../analyses/analysis-queue.service';

describe('HealthController', () => {
  const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
  const queue = { isReady: jest.fn() } as unknown as AnalysisQueueService;
  const controller = new HealthController(prisma, queue);

  it('returns the service health', () => {
    const response = controller.getHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('sourcecraft-repo-health-backend');
    expect(Date.parse(response.timestamp)).not.toBeNaN();
  });

  it('reports database readiness', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (queue.isReady as jest.Mock).mockResolvedValue(true);
    await expect(controller.getReadiness()).resolves.toEqual({
      status: 'ready',
      database: 'up',
      queue: 'up',
    });
  });

  it('returns 503 when the database is unavailable', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('offline'));
    await expect(controller.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
