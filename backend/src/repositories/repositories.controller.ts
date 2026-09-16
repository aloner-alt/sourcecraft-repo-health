import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListRepositoriesQueryDto } from './dto/list-repositories-query.dto';
import { RepositoriesService } from './repositories.service';
import { AnalysisHistoryQueryDto } from './dto/analysis-history-query.dto';
import { SessionAuthGuard } from '../auth/session-auth.guard';

@ApiTags('repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Post('sourcecraft/:organizationSlug/:repositorySlug/sync')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Import or refresh a repository from SourceCraft' })
  syncFromSourceCraft(
    @Param('organizationSlug') organizationSlug: string,
    @Param('repositorySlug') repositorySlug: string,
  ) {
    return this.repositoriesService.syncFromSourceCraft(
      organizationSlug,
      repositorySlug,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List and rank public SourceCraft repositories' })
  findPublic(@Query() query: ListRepositoriesQueryDto) {
    return this.repositoriesService.findPublic(query);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Get the latest completed health score' })
  getHealth(@Param('id') id: string) {
    return this.repositoriesService.getHealth(id);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get metrics and evidence from the latest analysis' })
  getMetrics(@Param('id') id: string) {
    return this.repositoriesService.getMetrics(id);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get prioritized repository recommendations' })
  getRecommendations(@Param('id') id: string) {
    return this.repositoriesService.getRecommendations(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get completed health score history' })
  getScoreHistory(
    @Param('id') id: string,
    @Query() query: AnalysisHistoryQueryDto,
  ) {
    return this.repositoriesService.getScoreHistory(id, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repository details and its latest analysis' })
  findById(@Param('id') id: string) {
    return this.repositoriesService.findById(id);
  }
}
