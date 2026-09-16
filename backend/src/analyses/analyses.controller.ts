import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalysesService } from './analyses.service';
import { StartAnalysisDto } from './dto/start-analysis.dto';

@ApiTags('analyses')
@Controller()
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Post('repositories/:repositoryId/analyses')
  @ApiOperation({ summary: 'Queue a repository analysis' })
  start(
    @Param('repositoryId') repositoryId: string,
    @Body() input: StartAnalysisDto,
  ) {
    return this.analysesService.start(repositoryId, input.trigger);
  }

  @Get('analyses/:id')
  @ApiOperation({ summary: 'Get analysis status and results' })
  findById(@Param('id') id: string) {
    return this.analysesService.findById(id);
  }
}
