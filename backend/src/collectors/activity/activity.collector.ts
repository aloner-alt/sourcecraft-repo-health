import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';
import { ActivityCollectionResult, ActivityMetric } from './activity.types';

const DAY = 24 * 60 * 60 * 1_000;

@Injectable()
export class ActivityCollector {
  constructor(private readonly sourceCraft: SourceCraftClient) {}

  async collect(
    repositoryId: string,
    organizationSlug: string,
    repositorySlug: string,
    lastActivityAt: Date | null,
    now = new Date(),
  ): Promise<ActivityCollectionResult> {
    const metrics: ActivityMetric[] = [];
    const failedSources: string[] = [];

    if (lastActivityAt) {
      const daysSinceLastActivity = this.daysBetween(lastActivityAt, now);
      metrics.push(this.metric('repository_recency', {
        lastActivityAt: lastActivityAt.toISOString(), daysSinceLastActivity,
      }, this.scoreRecency(daysSinceLastActivity), 0.4,
      'sourcecraft.repository.last_updated',
      `Last repository activity was ${daysSinceLastActivity} days ago.`));
    }

    const [contributors, pullRequests, releases] = await Promise.allSettled([
      this.sourceCraft.listRepositoryContributors(repositoryId, 100),
      this.sourceCraft.listRepositoryPullRequests(repositoryId, 100),
      this.sourceCraft.listRepositoryReleases(organizationSlug, repositorySlug, 100),
    ]);

    if (contributors.status === 'fulfilled') {
      const count = contributors.value.contributors.length;
      metrics.push(this.metric('contributor_depth',
        { contributors: count, sampleLimit: 100 },
        this.scoreContributors(count), 0.25,
        'sourcecraft.repository.contributors',
        `${count} contributors were returned by SourceCraft.`));
    } else failedSources.push('contributors');

    if (pullRequests.status === 'fulfilled') {
      const recent = pullRequests.value.pull_requests.filter(
        (item) => this.daysBetween(new Date(item.updated_at), now) <= 90,
      );
      const merged = recent.filter((item) => item.status === 'merged');
      metrics.push(this.metric('pull_request_flow',
        { recent: recent.length, merged: merged.length, windowDays: 90, sampleLimit: 100 },
        this.scorePullRequests(recent.length, merged.length), 0.2,
        'sourcecraft.repository.pull_requests',
        `${recent.length} merge requests were updated in 90 days; ${merged.length} were merged.`));
    } else failedSources.push('merge requests');

    if (releases.status === 'fulfilled') {
      const published = releases.value.releases.filter(
        (release) => release.status === 'published' && release.released_at,
      );
      const latest = published.map((release) => release.released_at as string).sort().at(-1);
      const daysSinceRelease = latest ? this.daysBetween(new Date(latest), now) : null;
      metrics.push(this.metric('release_freshness',
        { publishedReleases: published.length, latestReleaseAt: latest ?? null, daysSinceRelease },
        this.scoreRelease(daysSinceRelease), 0.15,
        'sourcecraft.repository.releases',
        latest ? `Latest published release was ${daysSinceRelease} days ago.` : 'No published releases were returned by SourceCraft.'));
    } else failedSources.push('releases');

    if (metrics.length === 0) {
      return { score: null, status: DataStatus.NO_DATA, summary: 'SourceCraft did not provide activity data.', metrics: [] };
    }

    const availableWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
    const score = this.round(metrics.reduce(
      (sum, metric) => sum + metric.normalizedScore * metric.weight, 0,
    ) / availableWeight);
    const suffix = failedSources.length ? ` Unavailable sources: ${failedSources.join(', ')}.` : '';
    return {
      score,
      status: DataStatus.AVAILABLE,
      summary: `${metrics.length} activity signals analyzed.${suffix}`,
      metrics: metrics.map((metric) => ({ ...metric, weight: this.round(metric.weight / availableWeight) })),
    };
  }

  private metric(key: string, rawValue: Record<string, unknown>, normalizedScore: number,
    weight: number, source: string, explanation: string): ActivityMetric {
    return { key, rawValue, normalizedScore, weight, status: DataStatus.AVAILABLE, source, explanation };
  }

  private scoreRecency(days: number): number {
    if (days <= 7) return 100;
    if (days <= 30) return 80;
    if (days <= 90) return 60;
    if (days <= 180) return 30;
    return 0;
  }

  private scoreContributors(count: number): number {
    if (count >= 10) return 100;
    if (count >= 5) return 80;
    if (count >= 3) return 60;
    if (count >= 2) return 40;
    if (count === 1) return 20;
    return 0;
  }

  private scorePullRequests(recent: number, merged: number): number {
    if (recent === 0) return 0;
    return this.round(Math.min(100, recent * 10) * 0.5 + (merged / recent) * 100 * 0.5);
  }

  private scoreRelease(days: number | null): number {
    if (days === null) return 0;
    if (days <= 90) return 100;
    if (days <= 180) return 75;
    if (days <= 365) return 40;
    return 10;
  }

  private daysBetween(from: Date, to: Date): number {
    return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY));
  }

  private round(value: number): number { return Math.round(value * 100) / 100; }
}
