import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalysesService } from './analyses.service';
import { AnalysisRunnerService } from './analysis-runner.service';
import { AnalysisQueueService } from './analysis-queue.service';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { StartAnalysisDto } from './dto/start-analysis.dto';

@ApiTags('analyses')
@Controller()
export class AnalysesController {
  constructor(
    private readonly analysesService: AnalysesService,
    private readonly analysisRunner: AnalysisRunnerService,
    private readonly analysisQueue: AnalysisQueueService,
  ) {}

  @Post('repositories/:repositoryId/analyses')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Queue a repository analysis' })
  start(
    @Param('repositoryId') repositoryId: string,
    @Body() input: StartAnalysisDto,
  ) {
    return this.analysisQueue.start(repositoryId, input.trigger);
  }

  @Get('analyses/:id')
  @ApiOperation({ summary: 'Get analysis status and results' })
  findById(@Param('id') id: string) {
    return this.analysesService.findById(id);
  }

  @Post('analyses/:id/run')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Run the available collectors for a queued analysis' })
  run(@Param('id') id: string) {
    return this.analysisRunner.run(id);
  }
}
