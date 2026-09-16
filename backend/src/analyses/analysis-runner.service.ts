import { Injectable } from '@nestjs/common';
import {
  DataStatus,
  EvidenceKind,
  HealthCategory as PrismaHealthCategory,
  Prisma,
} from '@prisma/client';
import { DocumentationCollector } from '../collectors/documentation/documentation.collector';
import { PrismaService } from '../database/prisma.service';
import { CATEGORY_WEIGHTS, HealthCategory } from '../scoring/scoring.constants';
import { ScoringService } from '../scoring/scoring.service';
import { AnalysesService } from './analyses.service';

@Injectable()
export class AnalysisRunnerService {
  constructor(
    private readonly analyses: AnalysesService,
    private readonly documentation: DocumentationCollector,
    private readonly scoring: ScoringService,
    private readonly prisma: PrismaService,
  ) {}

  async run(id: string) {
    const analysis = await this.analyses.findById(id);
    await this.analyses.markCollecting(id);

    try {
      const result = await this.documentation.collect(
        analysis.repository.ownerSlug,
        analysis.repository.slug,
      );
      await this.analyses.markCalculating(id);

      await this.prisma.categoryResult.create({
        data: {
          analysisId: id,
          category: PrismaHealthCategory.DOCUMENTATION,
          score: result.score,
          weight: CATEGORY_WEIGHTS[HealthCategory.DOCUMENTATION],
          status: DataStatus.AVAILABLE,
          summary: result.summary,
          metrics: {
            create: result.metrics.map((metric) => ({
              key: metric.key,
              rawValue: metric.rawValue as Prisma.InputJsonValue,
              normalizedScore: metric.normalizedScore,
              weight: metric.weight,
              status: DataStatus.AVAILABLE,
              source: metric.source,
              explanation: metric.explanation,
              evidence: {
                create: metric.evidence.map((evidence) => ({
                  kind: EvidenceKind.FILE,
                  label: evidence.label,
                  value: { path: evidence.path },
                })),
              },
            })),
          },
        },
      });

      const health = this.scoring.calculate([
        {
          category: HealthCategory.DOCUMENTATION,
          score: result.score,
        },
      ]);

      if (health.score === null) {
        throw new Error('Health score could not be calculated.');
      }

      await this.analyses.complete(id, {
        score: health.score,
        dataCoverage: health.dataCoverage,
      });

      return this.analyses.findById(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.analyses.fail(id, 'ANALYSIS_FAILED', message);
      throw error;
    }
  }
}
