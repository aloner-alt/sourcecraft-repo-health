import { Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListRepositoriesQueryDto } from './dto/list-repositories-query.dto';
import { RepositoriesService } from './repositories.service';
import { AnalysisHistoryQueryDto } from './dto/analysis-history-query.dto';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SessionUser } from '../auth/auth.types';

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
    @Req() request: Request & { user: SessionUser },
  ) {
    return this.repositoriesService.syncFromSourceCraft(
      organizationSlug,
      repositorySlug,
      request.user.id,
    );
  }

  @Get('mine')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'List repositories imported by the current user' })
  findMine(@Req() request: Request & { user: SessionUser }) {
    return this.repositoriesService.findMine(request.user.id);
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

  @Get(':id/badge.svg')
  @ApiOperation({ summary: 'Get a public SVG badge with the latest health score' })
  async getBadge(@Param('id') id: string, @Res() response: Response) {
    const health = await this.repositoriesService.getHealth(id);
    const score = Math.round(health.score ?? 0);
    const color = score >= 85 ? '#16803c' : score >= 70 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="28" role="img" aria-label="Repo health: ${score}/100"><rect width="168" height="28" rx="5" fill="#1f2937"/><path fill="${color}" d="M108 0h55a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5h-55z"/><g fill="#fff" font-family="Verdana,Arial,sans-serif" font-size="11"><text x="10" y="18">repo health</text><text x="119" y="18">${score}/100</text></g></svg>`;
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.send(svg);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repository details and its latest analysis' })
  findById(@Param('id') id: string) {
    return this.repositoriesService.findById(id);
  }
}
