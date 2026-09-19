import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { RepositoryTreeProvider } from '../repository-tree.provider';

const CHECKS = [
  { key: 'security_policy', weight: 0.35, label: 'SECURITY.md', match: (path: string) => /(^|\/)security\.md$/i.test(path) },
  { key: 'dependency_manifest', weight: 0.25, label: 'dependency manifest', match: (path: string) => /(^|\/)(package\.json|pyproject\.toml|requirements[^/]*\.txt|go\.mod|cargo\.toml|pom\.xml|build\.gradle(?:\.kts)?)$/i.test(path) },
  { key: 'dependency_lockfile', weight: 0.25, label: 'dependency lock file', match: (path: string) => /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|poetry\.lock|uv\.lock|go\.sum|cargo\.lock)$/i.test(path) },
  { key: 'dependency_updates', weight: 0.15, label: 'dependency update automation', match: (path: string) => /(^|\/)(dependabot\.ya?ml|renovate\.json|renovate\.json5)$/i.test(path) },
] as const;

export type SecurityCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: Array<{ key: string; rawValue: { present: boolean; path?: string }; normalizedScore: number; weight: number; status: DataStatus; source: string; explanation: string }>;
};

@Injectable()
export class SecurityCollector {
  constructor(private readonly tree: RepositoryTreeProvider) {}

  async collect(org: string, repo: string): Promise<SecurityCollectionResult> {
    const files = (await this.tree.get(org, repo)).filter((entry) => entry.type === 'file');
    const metrics = CHECKS.map((check) => {
      const file = files.find((entry) => check.match(entry.path));
      return {
        key: check.key,
        rawValue: { present: Boolean(file), ...(file ? { path: file.path } : {}) },
        normalizedScore: file ? 100 : 0,
        weight: check.weight,
        status: DataStatus.AVAILABLE,
        source: 'sourcecraft.repository_tree',
        explanation: file ? `${check.label} found at ${file.path}.` : `${check.label} was not found.`,
      };
    });
    const found = metrics.filter((metric) => metric.rawValue.present).length;
    return {
      score: metrics.reduce((sum, metric) => sum + metric.normalizedScore * metric.weight, 0),
      status: DataStatus.AVAILABLE,
      summary: `${found} of ${metrics.length} baseline security-hygiene checks passed; vulnerabilities were not assessed.`,
      metrics,
    };
  }

}
