import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { AnalysisQueueService } from '../analyses/analysis-queue.service';

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
