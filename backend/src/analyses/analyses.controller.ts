import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalysesService } from './analyses.service';
import { AnalysisQueueService } from './analysis-queue.service';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { StartAnalysisDto } from './dto/start-analysis.dto';
import { SessionUser } from '../auth/auth.types';

@ApiTags('analyses')
@Controller()
export class AnalysesController {
  constructor(
    private readonly analysesService: AnalysesService,
    private readonly analysisQueue: AnalysisQueueService,
  ) {}

  @Post('repositories/:repositoryId/analyses')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Queue a repository analysis' })
  start(
    @Param('repositoryId') repositoryId: string,
    @Body() input: StartAnalysisDto,
    @Req() request: Request & { user: SessionUser },
  ) {
    return this.analysisQueue.start(repositoryId, input.trigger, request.user.id);
  }

  @Get('analyses/:id')
  @ApiOperation({ summary: 'Get analysis status and results' })
  findById(@Param('id') id: string) {
    return this.analysesService.findById(id);
  }
}
