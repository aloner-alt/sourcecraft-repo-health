import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('analyses/:analysisId/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('report.md')
  @ApiProduces('text/markdown')
  @ApiOperation({ summary: 'Download an analysis report as Markdown' })
  async markdown(@Param('analysisId') id: string, @Res() response: Response) {
    const body = await this.reports.markdown(id);
    response.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="repo-health-${id}.md"`);
    response.send(body);
  }

  @Get('report.pdf')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Download an analysis report as PDF' })
  async pdf(@Param('analysisId') id: string, @Res() response: Response) {
    const body = await this.reports.pdf(id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="repo-health-${id}.pdf"`);
    response.send(body);
  }
}
