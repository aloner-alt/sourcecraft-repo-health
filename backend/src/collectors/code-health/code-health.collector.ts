import { Injectable } from '@nestjs/common';
import { DataStatus } from '@prisma/client';
import { RepositoryTreeProvider } from '../repository-tree.provider';

const CHECKS = [
  { key: 'automated_tests', weight: 0.45, label: 'automated tests', match: (path: string) => /(^|\/)(__tests__|tests?|specs?)(\/|$)|\.(test|spec)\.[^.]+$/i.test(path) },
  { key: 'static_analysis', weight: 0.25, label: 'static analysis configuration', match: (path: string) => /(^|\/)(eslint\.config\.|\.eslintrc|biome\.json|ruff\.toml|\.ruff\.toml|\.golangci\.ya?ml|phpstan\.neon)/i.test(path) },
  { key: 'formatting_rules', weight: 0.15, label: 'formatting rules', match: (path: string) => /(^|\/)(\.prettierrc|prettier\.config\.|\.editorconfig$|biome\.json$|rustfmt\.toml$)/i.test(path) },
  { key: 'typed_project', weight: 0.15, label: 'typed project configuration', match: (path: string) => /(^|\/)(tsconfig\.json|go\.mod|cargo\.toml|pom\.xml|.*\.csproj)$/i.test(path) },
] as const;

export type CodeHealthCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: Array<{ key: string; rawValue: { present: boolean; path?: string }; normalizedScore: number; weight: number; status: DataStatus; source: string; explanation: string }>;
};

@Injectable()
export class CodeHealthCollector {
  constructor(private readonly tree: RepositoryTreeProvider) {}

  async collect(org: string, repo: string): Promise<CodeHealthCollectionResult> {
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
        explanation: file ? `${check.label} detected at ${file.path}.` : `${check.label} were not detected.`,
      };
    });
    const found = metrics.filter((metric) => metric.rawValue.present).length;
    return {
      score: metrics.reduce((sum, metric) => sum + metric.normalizedScore * metric.weight, 0),
      status: DataStatus.AVAILABLE,
      summary: `${found} of ${metrics.length} code-health engineering practices detected.`,
      metrics,
    };
  }
}
