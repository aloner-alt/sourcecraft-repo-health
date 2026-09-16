import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { SourceCraftClient } from '../../sourcecraft/sourcecraft.client';
import { SourceCraftIssue } from '../../sourcecraft/sourcecraft.types';
import { IssueMetric, IssuesCollectionResult } from './issues.types';

const STALE_AFTER_DAYS = 30;
const MAX_PAGES = 100;

@Injectable()
export class IssuesCollector {
  constructor(private readonly sourceCraft: SourceCraftClient) {}

  async collect(
    organizationSlug: string,
    repositorySlug: string,
    now = new Date(),
  ): Promise<IssuesCollectionResult> {
    const issues = await this.loadIssues(organizationSlug, repositorySlug);

    if (issues.length === 0) {
      return {
        score: null,
        status: DataStatus.NO_DATA,
        summary: 'No issues were returned by SourceCraft.',
        metrics: [],
      };
    }

    const completed = issues.filter((issue) => Boolean(issue.completed_at));
    const open = issues.filter((issue) => !issue.completed_at);
    const staleOpen = open.filter((issue) => this.isStale(issue, now));
    const described = issues.filter((issue) => issue.description?.trim());

    const metrics: IssueMetric[] = [
      this.metric(
        'resolution_rate',
        { completed: completed.length, total: issues.length },
        this.percent(completed.length, issues.length),
        0.45,
        `${completed.length} of ${issues.length} issues are completed.`,
      ),
      this.metric(
        'open_issue_freshness',
        { fresh: open.length - staleOpen.length, open: open.length },
        open.length === 0
          ? 100
          : this.percent(open.length - staleOpen.length, open.length),
        0.35,
        `${staleOpen.length} of ${open.length} open issues have not been updated for ${STALE_AFTER_DAYS} days.`,
        staleOpen.slice(0, 10),
      ),
      this.metric(
        'description_coverage',
        { described: described.length, total: issues.length },
        this.percent(described.length, issues.length),
        0.2,
        `${described.length} of ${issues.length} issues have a description.`,
      ),
    ];
    const score = this.round(
      metrics.reduce(
        (total, metric) =>
          total + (metric.normalizedScore ?? 0) * metric.weight,
        0,
      ),
    );

    return {
      score,
      status: DataStatus.AVAILABLE,
      summary: `${issues.length} issues analyzed; ${open.length} open and ${staleOpen.length} stale.`,
      metrics,
    };
  }

  private async loadIssues(
    organizationSlug: string,
    repositorySlug: string,
  ): Promise<SourceCraftIssue[]> {
    const issues: SourceCraftIssue[] = [];
    let pageToken: string | undefined;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await this.sourceCraft.listRepositoryIssues(
        organizationSlug,
        repositorySlug,
        { pageSize: 100, pageToken },
      );
      issues.push(...result.issues);
      pageToken = result.next_page_token;
      if (!pageToken) return issues;
    }

    throw new Error(`SourceCraft issues exceeded ${MAX_PAGES} pages.`);
  }

  private metric(
    key: string,
    rawValue: Record<string, number>,
    normalizedScore: number,
    weight: number,
    explanation: string,
    evidenceIssues: SourceCraftIssue[] = [],
  ): IssueMetric {
    return {
      key,
      rawValue,
      normalizedScore,
      weight,
      status: DataStatus.AVAILABLE,
      source: 'sourcecraft.repository_issues',
      explanation,
      evidence: evidenceIssues.map((issue) => ({
        label: issue.title,
        value: {
          slug: issue.slug,
          updatedAt: issue.updated_at,
        },
      })),
    };
  }

  private isStale(issue: SourceCraftIssue, now: Date): boolean {
    const updatedAt = new Date(issue.updated_at).getTime();
    return now.getTime() - updatedAt > STALE_AFTER_DAYS * 24 * 60 * 60 * 1_000;
  }

  private percent(part: number, total: number): number {
    return total === 0 ? 0 : this.round((part / total) * 100);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
