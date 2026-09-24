import { Injectable } from '@nestjs/common';
import {
  DataStatus,
  EvidenceKind,
  HealthCategory as PrismaHealthCategory,
  Prisma,
} from '@prisma/client';
import { DocumentationCollector } from '../collectors/documentation/documentation.collector';
import { IssuesCollector } from '../collectors/issues/issues.collector';
import { ActivityCollector } from '../collectors/activity/activity.collector';
import { CiCdCollector } from '../collectors/cicd/cicd.collector';
import { SecurityCollector } from '../collectors/security/security.collector';
import { CodeHealthCollector } from '../collectors/code-health/code-health.collector';
import { PrismaService } from '../database/prisma.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { CATEGORY_WEIGHTS, HealthCategory } from '../scoring/scoring.constants';
import { ScoringService } from '../scoring/scoring.service';
import { AnalysesService } from './analyses.service';

@Injectable()
export class AnalysisRunnerService {
  constructor(
    private readonly analyses: AnalysesService,
    private readonly documentation: DocumentationCollector,
    private readonly issues: IssuesCollector,
    private readonly activity: ActivityCollector,
    private readonly cicd: CiCdCollector,
    private readonly security: SecurityCollector,
    private readonly codeHealth: CodeHealthCollector,
    private readonly scoring: ScoringService,
    private readonly recommendations: RecommendationsService,
    private readonly prisma: PrismaService,
  ) {}

  async run(id: string) {
    const analysis = await this.analyses.findById(id);
    await this.analyses.markCollecting(id);

    try {
      const [documentationResult, issuesResult, cicdResult, securityResult, codeHealthResult] = await Promise.all([
        this.collectSafely('documentation', this.documentation.collect(
          analysis.repository.ownerSlug,
          analysis.repository.slug,
        )),
        this.collectSafely('issues', this.issues.collect(
          analysis.repository.ownerSlug,
          analysis.repository.slug,
        )),
        this.collectSafely('CI/CD', this.cicd.collect(
          analysis.repository.ownerSlug,
          analysis.repository.slug,
        )),
        this.collectSafely('security', this.security.collect(
          analysis.repository.ownerSlug,
          analysis.repository.slug,
        )),
        this.collectSafely('code health', this.codeHealth.collect(
          analysis.repository.ownerSlug,
          analysis.repository.slug,
        )),
      ]);
      const activityResult = await this.collectSafely('activity', this.activity.collect(\n        analysis.repository.ownerSlug,\n        analysis.repository.slug,\n        analysis.repository.lastActivityAt,\n      ));
      await this.analyses.markCalculating(id);

      await this.prisma.$transaction([
        this.prisma.categoryResult.create({
          data: {
            analysisId: id,
            category: PrismaHealthCategory.DOCUMENTATION,
            score: documentationResult.score,
            weight: CATEGORY_WEIGHTS[HealthCategory.DOCUMENTATION],
            status: documentationResult.status,
            summary: documentationResult.summary,
            metrics: {
              create: documentationResult.metrics.map((metric) => ({
                key: metric.key,
                rawValue: metric.rawValue as Prisma.InputJsonValue,
                normalizedScore: metric.normalizedScore,
                weight: metric.weight,
                status: documentationResult.status,
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
        }),
        this.prisma.categoryResult.create({
          data: {
            analysisId: id,
            category: PrismaHealthCategory.ISSUES,
            score: issuesResult.score,
            weight: CATEGORY_WEIGHTS[HealthCategory.ISSUES],
            status: issuesResult.status,
            summary: issuesResult.summary,
            metrics: {
              create: issuesResult.metrics.map((metric) => ({
                key: metric.key,
                rawValue: metric.rawValue as Prisma.InputJsonValue,
                normalizedScore: metric.normalizedScore,
                weight: metric.weight,
                status: metric.status,
                source: metric.source,
                explanation: metric.explanation,
                evidence: {
                  create: metric.evidence.map((evidence) => ({
                    kind: EvidenceKind.ISSUE,
                    label: evidence.label,
                    value: evidence.value,
                  })),
                },
              })),
            },
          },
        }),
        this.prisma.categoryResult.create({
          data: {
            analysisId: id,
            category: PrismaHealthCategory.ACTIVITY,
            score: activityResult.score,
            weight: CATEGORY_WEIGHTS[HealthCategory.ACTIVITY],
            status: activityResult.status,
            summary: activityResult.summary,
            metrics: {
              create: activityResult.metrics.map((metric) => ({
                key: metric.key,
                rawValue: metric.rawValue as Prisma.InputJsonValue,
                normalizedScore: metric.normalizedScore,
                weight: metric.weight,
                status: metric.status,
                source: metric.source,
                explanation: metric.explanation,
                evidence: {
                  create: [
                    {
                      kind: EvidenceKind.METRIC,
                      label: 'Last repository activity',
                      value: metric.rawValue as Prisma.InputJsonValue,
                    },
                  ],
                },
              })),
            },
          },
        }),
        this.prisma.categoryResult.create({
          data: {
            analysisId: id,
            category: PrismaHealthCategory.CI_CD,
            score: cicdResult.score,
            weight: CATEGORY_WEIGHTS[HealthCategory.CI_CD],
            status: cicdResult.status,
            summary: cicdResult.summary,
            metrics: {
              create: cicdResult.metrics.map((metric) => ({
                key: metric.key,
                rawValue: metric.rawValue as Prisma.InputJsonValue,
                normalizedScore: metric.normalizedScore,
                weight: metric.weight,
                status: metric.status,
                source: metric.source,
                explanation: metric.explanation,
                evidence: { create: [{ kind: EvidenceKind.PIPELINE, label: metric.key, value: metric.rawValue as Prisma.InputJsonValue }] },
              })),
            },
          },
        }),
        this.prisma.categoryResult.create({
          data: {
            analysisId: id,
            category: PrismaHealthCategory.SECURITY,
            score: securityResult.score,
            weight: CATEGORY_WEIGHTS[HealthCategory.SECURITY],
            status: securityResult.status,
            summary: securityResult.summary,
            metrics: {
              create: securityResult.metrics.map((metric) => ({
                key: metric.key,
                rawValue: metric.rawValue as Prisma.InputJsonValue,
                normalizedScore: metric.normalizedScore,
                weight: metric.weight,
                status: metric.status,
                source: metric.source,
                explanation: metric.explanation,
                evidence: undefined,
              })),
            },
          },
        }),
        this.prisma.categoryResult.create({
          data: {
            analysisId: id,
            category: PrismaHealthCategory.CODE_HEALTH,
            score: codeHealthResult.score,
            weight: CATEGORY_WEIGHTS[HealthCategory.CODE_HEALTH],
            status: codeHealthResult.status,
            summary: codeHealthResult.summary,
            metrics: { create: codeHealthResult.metrics.map((metric) => ({
              key: metric.key,
              rawValue: metric.rawValue as Prisma.InputJsonValue,
              normalizedScore: metric.normalizedScore,
              weight: metric.weight,
              status: metric.status,
              source: metric.source,
              explanation: metric.explanation,
              evidence: undefined,
            })) },
          },
        }),
      ]);

      const availableCategories = [
        ...(documentationResult.score === null ? [] : [{ category: HealthCategory.DOCUMENTATION, score: documentationResult.score }]),
        ...(issuesResult.score === null
          ? []
          : [{ category: HealthCategory.ISSUES, score: issuesResult.score }]),
        ...(activityResult.score === null
          ? []
          : [
              {
                category: HealthCategory.ACTIVITY,
                score: activityResult.score,
              },
            ]),
        ...(cicdResult.score === null
          ? []
          : [{ category: HealthCategory.CI_CD, score: cicdResult.score }]),
        ...(securityResult.score === null ? [] : [{ category: HealthCategory.SECURITY, score: securityResult.score }]),
        ...(codeHealthResult.score === null ? [] : [{ category: HealthCategory.CODE_HEALTH, score: codeHealthResult.score }]),
      ];
      const health = this.scoring.calculate(availableCategories);

      if (health.score === null) {
        throw new Error('Health score could not be calculated.');
      }

      const recommendations = this.recommendations.build(
        documentationResult,
        issuesResult,
        activityResult,
        cicdResult,
        securityResult,
        codeHealthResult,
        health.availableWeight,
      );
      if (recommendations.length > 0) {
        await this.prisma.$transaction(
          recommendations.map((recommendation) =>
            this.prisma.recommendation.create({
              data: {
                analysisId: id,
                category: recommendation.category,
                priority: recommendation.priority,
                title: recommendation.title,
                problem: recommendation.problem,
                rationale: recommendation.rationale,
                action: recommendation.action,
                expectedScoreDelta: recommendation.expectedScoreDelta,
                confidence: recommendation.confidence,
                evidence: {
                  create: recommendation.evidence.map((evidence) => ({
                    kind: evidence.kind,
                    label: evidence.label,
                    value: evidence.value as Prisma.InputJsonValue,
                  })),
                },
              },
            }),
          ),
        );
      }
      // Potential Score is recalculated from the same category aggregation.
      // Recommendations are grouped by category and capped at that category's
      // remaining contribution, so several fixes cannot push a category above
      // 100 or double-count the same available weight.
      const deltaByCategory = new Map<PrismaHealthCategory, number>();
      for (const recommendation of recommendations) {
        deltaByCategory.set(
          recommendation.category,
          (deltaByCategory.get(recommendation.category) ?? 0) +
            recommendation.expectedScoreDelta,
        );
      }
      const potentialDelta = availableCategories.reduce((total, category) => {
        const rawDelta = deltaByCategory.get(category.category) ?? 0;
        const currentContribution = (category.score * CATEGORY_WEIGHTS[category.category]) / health.availableWeight;
        const maxContribution = (100 * CATEGORY_WEIGHTS[category.category]) / health.availableWeight;
        return total + Math.min(rawDelta, Math.max(0, maxContribution - currentContribution));
      }, 0);
      const potentialScore = Math.min(
        100,
        Math.round((health.score + potentialDelta) * 100) / 100,
      );

      await this.analyses.complete(id, {
        score: health.score,
        potentialScore,
        dataCoverage: health.dataCoverage,
      });

      return this.analyses.findById(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.analyses.fail(id, 'ANALYSIS_FAILED', message);
      throw error;
    }
  }

  private async collectSafely<T extends {
    score: number | null;
    status: DataStatus;
    summary: string;
    metrics: unknown[];
  }>(name: string, collection: Promise<T>): Promise<T> {
    try {
      return await collection;
    } catch (error) {
      return {
        score: null,
        status: DataStatus.COLLECTION_ERROR,
        summary: `${name} source is temporarily unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
        metrics: [],
      } as unknown as T;
    }
  }
}

