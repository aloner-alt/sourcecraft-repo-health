import { Injectable } from '@nestjs/common';
import {
  EvidenceKind,
  HealthCategory,
  RecommendationPriority,
} from '@prisma/client';
import { DocumentationCollectionResult } from '../collectors/documentation/documentation.types';
import { IssuesCollectionResult } from '../collectors/issues/issues.types';
import { ActivityCollectionResult } from '../collectors/activity/activity.types';
import { CiCdCollectionResult } from '../collectors/cicd/cicd.types';
import { SecurityCollectionResult } from '../collectors/security/security.collector';
import { CodeHealthCollectionResult } from '../collectors/code-health/code-health.collector';
import { CATEGORY_WEIGHTS } from '../scoring/scoring.constants';
import { GeneratedRecommendation } from './recommendations.types';

const DOCUMENTATION_ACTIONS: Record<
  string,
  { title: string; problem: string; action: string }
> = {
  readme: {
    title: 'Add a README',
    problem: 'The repository has no discoverable README file.',
    action: 'Add a README with the project purpose, setup, and usage examples.',
  },
  license: {
    title: 'Add a license',
    problem: 'The repository has no discoverable license file.',
    action: 'Choose an appropriate open-source license and add it at repository root.',
  },
  contributing: {
    title: 'Document contribution rules',
    problem: 'The repository has no discoverable contributing guide.',
    action: 'Add CONTRIBUTING.md with setup, testing, and pull-request guidance.',
  },
  codeowners: {
    title: 'Define code ownership',
    problem: 'The repository has no discoverable CODEOWNERS file.',
    action: 'Add CODEOWNERS and assign maintainers to important paths.',
  },
};

@Injectable()
export class RecommendationsService {
  build(
    documentation: DocumentationCollectionResult,
    issues: IssuesCollectionResult,
    activity: ActivityCollectionResult,
    cicd: CiCdCollectionResult,
    security: SecurityCollectionResult,
    codeHealth: CodeHealthCollectionResult,
    availableWeight: number,
  ): GeneratedRecommendation[] {
    const recommendations = documentation.metrics
      .filter((metric) => !metric.rawValue.present)
      .map((metric) => {
        const copy = DOCUMENTATION_ACTIONS[metric.key];
        const delta = this.overallDelta(
          metric.weight * 100,
          CATEGORY_WEIGHTS.DOCUMENTATION,
          availableWeight,
        );
        return this.recommendation(
          HealthCategory.DOCUMENTATION,
          copy.title,
          copy.problem,
          'Baseline project files reduce onboarding and governance ambiguity.',
          copy.action,
          delta,
          EvidenceKind.METRIC,
          metric.key,
          metric.rawValue,
        );
      });

    const freshness = issues.metrics.find(
      (metric) => metric.key === 'open_issue_freshness',
    );
    if (
      freshness?.normalizedScore !== null &&
      freshness?.normalizedScore !== undefined &&
      freshness.normalizedScore < 100
    ) {
      recommendations.push(
        this.recommendation(
          HealthCategory.ISSUES,
          'Review stale issues',
          freshness.explanation,
          'A current issue backlog helps contributors understand project priorities.',
          'Close obsolete issues or update their status, owner, and next action.',
          this.overallDelta(
            (100 - freshness.normalizedScore) * freshness.weight,
            CATEGORY_WEIGHTS.ISSUES,
            availableWeight,
          ),
          EvidenceKind.METRIC,
          freshness.key,
          freshness.rawValue,
        ),
      );
    }

    const descriptions = issues.metrics.find(
      (metric) => metric.key === 'description_coverage',
    );
    if (
      descriptions?.normalizedScore !== null &&
      descriptions?.normalizedScore !== undefined &&
      descriptions.normalizedScore < 100
    ) {
      recommendations.push(
        this.recommendation(
          HealthCategory.ISSUES,
          'Describe incomplete issues',
          descriptions.explanation,
          'Clear issue descriptions make work easier to reproduce and estimate.',
          'Add context, expected behavior, and acceptance criteria to empty issues.',
          this.overallDelta(
            (100 - descriptions.normalizedScore) * descriptions.weight,
            CATEGORY_WEIGHTS.ISSUES,
            availableWeight,
          ),
          EvidenceKind.METRIC,
          descriptions.key,
          descriptions.rawValue,
        ),
      );
    }

    const recency = activity.metrics.find(
      (metric) => metric.key === 'repository_recency',
    );
    if (recency && recency.normalizedScore < 80) {
      recommendations.push(
        this.recommendation(
          HealthCategory.ACTIVITY,
          'Resume repository activity',
          activity.summary,
          'Long inactivity makes maintenance status unclear to users and contributors.',
          'Publish a maintenance update and merge a meaningful repository change.',
          this.overallDelta(
            (100 - recency.normalizedScore) * recency.weight,
            CATEGORY_WEIGHTS.ACTIVITY,
            availableWeight,
          ),
          EvidenceKind.METRIC,
          recency.key,
          recency.rawValue,
        ),
      );
    }

    const successRate = cicd.metrics.find(
      (metric) => metric.key === 'success_rate',
    );
    if (successRate && successRate.normalizedScore < 80) {
      recommendations.push(
        this.recommendation(
          HealthCategory.CI_CD,
          'Stabilize CI/CD runs',
          successRate.explanation,
          'Reliable automation prevents broken changes from reaching users.',
          'Inspect failed and timed-out runs, fix the recurring cause, and rerun the pipeline.',
          this.overallDelta(
            (100 - successRate.normalizedScore) * successRate.weight,
            CATEGORY_WEIGHTS.CI_CD,
            availableWeight,
          ),
          EvidenceKind.PIPELINE,
          successRate.key,
          successRate.rawValue,
        ),
      );
    }

    const securityTitles: Record<string, string> = {
      security_policy: 'Add a security policy',
      dependency_manifest: 'Declare project dependencies',
      dependency_lockfile: 'Lock dependency versions',
      dependency_updates: 'Automate dependency updates',
    };
    for (const metric of security.metrics.filter(
      (item) => !item.rawValue.present,
    )) {
      recommendations.push(
        this.recommendation(
          HealthCategory.SECURITY,
          securityTitles[metric.key],
          metric.explanation,
          'Baseline security hygiene makes dependency and vulnerability handling repeatable.',
          `Implement the missing ${metric.key.replaceAll('_', ' ')} control and document ownership.`,
          this.overallDelta(
            100 * metric.weight,
            CATEGORY_WEIGHTS.SECURITY,
            availableWeight,
          ),
          EvidenceKind.METRIC,
          metric.key,
          metric.rawValue,
        ),
      );
    }

    const codeHealthTitles: Record<string, string> = {
      automated_tests: 'Add automated tests',
      static_analysis: 'Configure static analysis',
      formatting_rules: 'Add consistent formatting rules',
      typed_project: 'Enable typed project checks',
    };
    for (const metric of codeHealth.metrics.filter(
      (item) => !item.rawValue.present,
    )) {
      recommendations.push(
        this.recommendation(
          HealthCategory.CODE_HEALTH,
          codeHealthTitles[metric.key],
          metric.explanation,
          'Automated engineering checks reduce regressions and review overhead.',
          `Implement ${metric.key.replaceAll('_', ' ')} and run it in CI.`,
          this.overallDelta(
            100 * metric.weight,
            CATEGORY_WEIGHTS.CODE_HEALTH,
            availableWeight,
          ),
          EvidenceKind.METRIC,
          metric.key,
          metric.rawValue,
        ),
      );
    }

    return recommendations.sort(
      (left, right) => right.expectedScoreDelta - left.expectedScoreDelta,
    );
  }

  private recommendation(
    category: HealthCategory,
    title: string,
    problem: string,
    rationale: string,
    action: string,
    expectedScoreDelta: number,
    evidenceKind: EvidenceKind,
    evidenceLabel: string,
    evidenceValue: Record<string, unknown>,
  ): GeneratedRecommendation {
    return {
      category,
      priority: this.priority(expectedScoreDelta),
      title,
      problem,
      rationale,
      action,
      expectedScoreDelta,
      confidence: 0.9,
      evidence: [
        {
          kind: evidenceKind,
          label: evidenceLabel,
          value: evidenceValue,
        },
      ],
    };
  }

  private overallDelta(
    categoryDelta: number,
    categoryWeight: number,
    availableWeight: number,
  ): number {
    return this.round((categoryDelta * categoryWeight) / availableWeight);
  }

  private priority(delta: number): RecommendationPriority {
    if (delta >= 8) return RecommendationPriority.HIGH;
    if (delta >= 3) return RecommendationPriority.MEDIUM;
    return RecommendationPriority.LOW;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
