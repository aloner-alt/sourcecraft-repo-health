import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';
import { SourceCraftCiRun } from '../../sourcecraft/sourcecraft.types';
import { CiCdCollectionResult, CiCdMetric } from './cicd.types';

const TERMINAL = new Set(['success', 'failed', 'canceled', 'timeout', 'skipped', 'rejected']);

@Injectable()
export class CiCdCollector {
  constructor(private readonly sourceCraft: SourceCraftClient) {}

  async collect(org: string, repo: string, now = new Date()): Promise<CiCdCollectionResult> {
    const runs = await this.loadRuns(org, repo);
    if (runs.length === 0) {
      return { score: null, status: DataStatus.NO_DATA, summary: 'No CI/CD runs were returned by SourceCraft.', metrics: [] };
    }

    const terminal = runs.filter((run) => TERMINAL.has(run.status));
    const successful = terminal.filter((run) => run.status === 'success');
    const latestSuccess = successful
      .map((run) => run.dates.finished_at ?? run.dates.updated_at)
      .sort()
      .at(-1);
    const successAge = latestSuccess
      ? Math.max(0, Math.floor((now.getTime() - new Date(latestSuccess).getTime()) / 86_400_000))
      : null;
    const successRate = terminal.length ? this.round((successful.length / terminal.length) * 100) : 0;
    const freshness = successAge === null ? 0 : successAge <= 30 ? 100 : successAge <= 90 ? 50 : 0;
    const metrics: CiCdMetric[] = [
      this.metric('pipeline_presence', { runs: runs.length }, 100, 0.2, `${runs.length} CI/CD runs found.`),
      this.metric('success_rate', { successful: successful.length, terminal: terminal.length }, successRate, 0.6, `${successful.length} of ${terminal.length} completed runs succeeded.`),
      this.metric('successful_run_freshness', { daysSinceSuccess: successAge, latestSuccess: latestSuccess ?? null }, freshness, 0.2, latestSuccess ? `Last successful run was ${successAge} days ago.` : 'No successful run was found.'),
    ];
    const score = this.round(metrics.reduce((sum, metric) => sum + metric.normalizedScore * metric.weight, 0));
    return { score, status: DataStatus.AVAILABLE, summary: `${runs.length} CI/CD runs analyzed with ${successRate}% terminal-run success.`, metrics };
  }

  private async loadRuns(org: string, repo: string): Promise<SourceCraftCiRun[]> {
    const runs: SourceCraftCiRun[] = [];
    let token: string | undefined;
    for (let page = 0; page < 100; page += 1) {
      const result = await this.sourceCraft.listRepositoryCiRuns(org, repo, 100, token);
      runs.push(...result.runs);
      token = result.next_page_token;
      if (!token) return runs;
    }
    throw new Error('SourceCraft CI/CD runs exceeded 100 pages.');
  }

  private metric(key: string, rawValue: CiCdMetric['rawValue'], normalizedScore: number, weight: number, explanation: string): CiCdMetric {
    return { key, rawValue, normalizedScore, weight, explanation, status: DataStatus.AVAILABLE, source: 'sourcecraft.cicd.runs' };
  }

  private round(value: number): number { return Math.round(value * 100) / 100; }
}
