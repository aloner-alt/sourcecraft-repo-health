import { Injectable, Optional } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';\nimport { SourceCraftPullRequest, SourceCraftRelease } from '../../sourcecraft/sourcecraft.types';
import { ActivityCollectionResult, ActivityMetric } from './activity.types';

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ActivityCollector {
  constructor(@Optional() private readonly sourceCraft?: SourceCraftClient) {}

  async collect(org: string, repo: string, lastActivityAt: Date | null, now = new Date()): Promise<ActivityCollectionResult> {
    const metrics: ActivityMetric[] = [];
    if (lastActivityAt) {
      const days = Math.max(0, Math.floor((now.getTime() - lastActivityAt.getTime()) / DAY));
      metrics.push({ key: 'repository_recency', rawValue: { lastActivityAt: lastActivityAt.toISOString(), daysSinceLastActivity: days }, normalizedScore: this.scoreRecency(days), weight: 0.6, status: DataStatus.AVAILABLE, source: 'sourcecraft.repository.last_updated', explanation: 'Recency score: 100 up to 7 days, 80 up to 30, 60 up to 90, 30 up to 180, then 0.' });
    }
    if (this.sourceCraft && org && repo) {
      const [pulls, releases] = await Promise.allSettled([
        this.collectAll((token) => this.sourceCraft!.listRepositoryPullRequests(org, repo, 100, token).then((page) => ({ items: page.pull_requests ?? page.pulls ?? [], next_page_token: page.next_page_token }))),
        this.collectAll((token) => this.sourceCraft!.listRepositoryReleases(org, repo, 100, token).then((page) => ({ items: page.releases ?? [], next_page_token: page.next_page_token }))),
      ]);
      if (pulls?.status === 'fulfilled') {
        const recent = pulls.value.filter((p) => this.inWindow(p.updated_at ?? p.created_at, now, 90 * DAY));
        const merged = recent.filter((p) => p.status === 'merged').length;
        metrics.push({ key: 'pull_requests_90d', rawValue: { total: recent.length, merged }, normalizedScore: Math.min(100, recent.length * 10), weight: 0.25, status: DataStatus.AVAILABLE, source: 'sourcecraft.repository.pull_requests', explanation: 'Count of pull requests updated in the last 90 days; endpoint response is retained as evidence.' });
      }
      if (releases?.status === 'fulfilled') {
        const recent = releases.value.filter((r) => this.inWindow(r.released_at ?? r.updated_at ?? r.created_at, now, 180 * DAY));
        metrics.push({ key: 'releases_180d', rawValue: { total: recent.length }, normalizedScore: Math.min(100, recent.length * 25), weight: 0.15, status: DataStatus.AVAILABLE, source: 'sourcecraft.repository.releases', explanation: 'Published releases in the last 180 days; drafts/discarded releases are excluded.' });
      }
    }
    if (metrics.length === 0) { const endpointFailed = Boolean(this.sourceCraft && pulls?.status === 'rejected' && releases?.status === 'rejected'); return { score: null, status: endpointFailed ? DataStatus.COLLECTION_ERROR : DataStatus.NO_DATA, summary: endpointFailed ? 'SourceCraft activity endpoints failed; no activity score was inferred.' : 'SourceCraft did not provide activity timestamps or optional activity endpoints.', metrics: [] }; }
    const score = metrics.reduce((sum, metric) => sum + metric.normalizedScore * metric.weight, 0) / metrics.reduce((sum, metric) => sum + metric.weight, 0);
    return { score: Math.round(score * 100) / 100, status: DataStatus.AVAILABLE, summary: `${metrics.length} activity signals collected from SourceCraft.`, metrics };
  }

  private async collectAll<T>(fetchPage: (token?: string) => Promise<{ items: T[]; next_page_token?: string }>): Promise<T[]> {
    const result: T[] = []; let token: string | undefined;
    for (let page = 0; page < 100; page += 1) { const response = await fetchPage(token); result.push(...response.items); token = response.next_page_token; if (!token) break; }
    return result;
  }
  private inWindow(value: string | undefined, now: Date, windowMs: number): boolean { return Boolean(value && now.getTime() - new Date(value).getTime() <= windowMs && new Date(value).getTime() <= now.getTime()); }
  private scoreRecency(days: number): number { if (days <= 7) return 100; if (days <= 30) return 80; if (days <= 90) return 60; if (days <= 180) return 30; return 0; }
}
