import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
  service: 'sourcecraft-repo-health-backend';
  timestamp: string;
};

@ApiTags('system')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'The backend is running.' })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'sourcecraft-repo-health-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
