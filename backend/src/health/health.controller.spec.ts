import { HealthController } from './health.controller';
import { PrismaService } from '../database/prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { AnalysisQueueService } from '../analyses/analysis-queue.service';
import { ConfigService } from '@nestjs/config';

describe('HealthController', () => {
  const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
  const queue = { isReady: jest.fn() } as unknown as AnalysisQueueService;
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        SOURCECRAFT_TOKEN: 'sourcecraft-token',
        SOURCECRAFT_CLI_PATH: '/opt/sourcecraft/bin/src',
        YANDEX_CLIENT_ID: 'client-id',
        YANDEX_CLIENT_SECRET: 'client-secret',
        YANDEX_CALLBACK_URL: 'http://localhost:3000/api/auth/yandex/callback',
      };
      return values[key] ?? fallback;
    }),
  } as unknown as ConfigService;
  const controller = new HealthController(prisma, queue, config);

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

  it('reports configuration without exposing secrets', () => {
    expect(controller.getConfigStatus()).toEqual({
      sourceCraftTokenConfigured: true,
      appSecCliConfigured: true,
      yandexAuthConfigured: true,
      frontendUrl: 'http://localhost:3001',
    });
    expect(JSON.stringify(controller.getConfigStatus())).not.toContain(
      'sourcecraft-token',
    );
    expect(JSON.stringify(controller.getConfigStatus())).not.toContain(
      'client-secret',
    );
  });

  it('returns 503 when the database is unavailable', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('offline'));
    await expect(controller.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
