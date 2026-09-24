import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { AnalysisQueueService } from '../analyses/analysis-queue.service';
import { ConfigService } from '@nestjs/config';

type HealthResponse = {
  status: 'ok';
  service: 'sourcecraft-repo-health-backend';
  timestamp: string;
};

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisQueue: AnalysisQueueService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'The backend is running.' })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'sourcecraft-repo-health-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('config')
  @ApiOkResponse({
    description: 'Configuration status without secret values.',
  })
  getConfigStatus() {
    const yandexClientId = this.config.get<string>('YANDEX_CLIENT_ID');
    const yandexClientSecret = this.config.get<string>('YANDEX_CLIENT_SECRET');
    const yandexCallbackUrl = this.config.get<string>('YANDEX_CALLBACK_URL');

    return {
      sourceCraftTokenConfigured: Boolean(
        this.config.get<string>('SOURCECRAFT_TOKEN'),
      ),
      appSecCliConfigured: Boolean(
        this.config.get<string>('SOURCECRAFT_CLI_PATH'),
      ),
      yandexAuthConfigured: Boolean(
        yandexClientId && yandexClientSecret && yandexCallbackUrl,
      ),
      frontendUrl: this.config.get<string>(
        'FRONTEND_URL',
        'http://localhost:3001',
      ),
    };
  }

  @Get('ready')
  @ApiOkResponse({ description: 'The API and PostgreSQL are ready.' })
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      if (!(await this.analysisQueue.isReady())) throw new Error('queue down');
      return {
        status: 'ready' as const,
        database: 'up' as const,
        queue: 'up' as const,
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        dependency: 'PostgreSQL or Redis',
      });
    }
  }
}
