import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';

type HealthResponse = {
  status: 'ok';
  service: 'sourcecraft-repo-health-backend';
  timestamp: string;
};

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

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
      return { status: 'ready' as const, database: 'up' as const };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'down',
      });
    }
  }
}
