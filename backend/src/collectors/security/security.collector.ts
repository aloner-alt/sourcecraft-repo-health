import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { AppSecFinding, AppSecProvider, AppSecSeverity } from './appsec.provider';
import { SecurityCollectionResult, SecurityMetric } from './security.types';

const SEVERITY_METRICS: Array<{
  severity: AppSecSeverity;
  key: string;
  weight: number;
  penalty: number;
}> = [
  { severity: 'critical', key: 'open_critical_findings', weight: 0.35, penalty: 50 },
  { severity: 'high', key: 'open_high_findings', weight: 0.25, penalty: 25 },
  { severity: 'medium', key: 'open_medium_findings', weight: 0.1, penalty: 10 },
  { severity: 'low', key: 'open_low_findings', weight: 0.05, penalty: 5 },
];

@Injectable()
export class SecurityCollector {
  constructor(private readonly appSec: AppSecProvider) {}

  async collect(org: string, repo: string): Promise<SecurityCollectionResult> {
    if (!this.appSec.isConfigured()) {
      return {
        score: null,
        status: DataStatus.NO_DATA,
        summary:
          'SourceCraft AppSec is not configured; Security is excluded from the score instead of being simulated.',
        metrics: [],
      };
    }

    let findings: AppSecFinding[];
    try {
      findings = await this.appSec.listFindings(org, repo);
    } catch (error) {
      const detail = this.errorText(error);
      if (/insufficient permissions|permission denied|forbidden/i.test(detail)) {
        return {
          score: null,
          status: DataStatus.PERMISSION_DENIED,
          summary:
            'SourceCraft AppSec denied access for the configured CLI identity; Security is excluded from the score.',
          metrics: [],
        };
      }
      if (/no (latest )?scan|appsec is .*unavailable|not enabled/i.test(detail)) {
        return {
          score: null,
          status: DataStatus.NO_DATA,
          summary:
            'SourceCraft AppSec has no available scan for this repository; Security is excluded from the score.',
          metrics: [],
        };
      }
      throw error;
    }
    const open = findings.filter((finding) => !finding.fixed);
    const metrics: SecurityMetric[] = SEVERITY_METRICS.map((definition) => {
      const selected = open.filter(
        (finding) => finding.severity === definition.severity,
      );
      return this.severityMetric(definition, selected);
    });

    const fixedCount = findings.length - open.length;
    const remediationRate = findings.length
      ? Math.round((fixedCount / findings.length) * 10_000) / 100
      : 100;
    metrics.push({
      key: 'remediation_rate',
      rawValue: {
        totalFindings: findings.length,
        fixedFindings: fixedCount,
        remediationRate,
        scanners: [...new Set(findings.map((finding) => finding.scanner))],
      },
      normalizedScore: remediationRate,
      weight: 0.25,
      status: DataStatus.AVAILABLE,
      source: 'sourcecraft.appsec.cli',
      explanation: `${fixedCount} of ${findings.length} AppSec findings are fixed or resolved.`,
    });

    return {
      score: this.round(
        metrics.reduce(
          (sum, metric) => sum + metric.normalizedScore * metric.weight,
          0,
        ),
      ),
      status: DataStatus.AVAILABLE,
      summary: `${findings.length} real SourceCraft AppSec findings analyzed; ${open.length} remain open.`,
      metrics,
    };
  }

  private severityMetric(
    definition: (typeof SEVERITY_METRICS)[number],
    findings: AppSecFinding[],
  ): SecurityMetric {
    return {
      key: definition.key,
      rawValue: {
        count: findings.length,
        findings: findings.slice(0, 20).map((finding) => ({
          id: finding.id,
          title: finding.title,
          status: finding.status,
          scanner: finding.scanner,
          ...(finding.url ? { url: finding.url } : {}),
        })),
        evidenceLimit: 20,
      },
      normalizedScore: Math.max(0, 100 - findings.length * definition.penalty),
      weight: definition.weight,
      status: DataStatus.AVAILABLE,
      source: 'sourcecraft.appsec.cli',
      explanation: `${findings.length} open ${definition.severity} AppSec findings.`,
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private errorText(error: unknown): string {
    if (typeof error !== 'object' || error === null) return String(error);
    const candidate = error as { message?: unknown; stderr?: unknown };
    return [candidate.message, candidate.stderr]
      .filter((value): value is string => typeof value === 'string')
      .join('\n');
  }
}
