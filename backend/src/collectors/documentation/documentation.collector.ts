import { Injectable } from '@nestjs/common';
import { SourceCraftTreeEntry } from '../../sourcecraft/sourcecraft.types';
import { RepositoryTreeProvider } from '../repository-tree.provider';
import {
  DocumentationCollectionResult,
  DocumentationMetric,
} from './documentation.types';

const DOCUMENTATION_FILES = [
  { key: 'readme', pattern: /^readme(?:\..+)?$/i, weight: 0.4, label: 'README' },
  { key: 'license', pattern: /^(?:license|licence)(?:\..+)?$/i, weight: 0.25, label: 'License' },
  { key: 'contributing', pattern: /^contributing(?:\..+)?$/i, weight: 0.2, label: 'Contributing guide' },
  { key: 'codeowners', pattern: /^codeowners$/i, weight: 0.15, label: 'CODEOWNERS' },
] as const;

@Injectable()
export class DocumentationCollector {
  constructor(private readonly tree: RepositoryTreeProvider) {}

  async collect(
    organizationSlug: string,
    repositorySlug: string,
  ): Promise<DocumentationCollectionResult> {
    const entries = await this.tree.get(organizationSlug, repositorySlug);
    const files = entries.filter((entry) => entry.type === 'file');
    const metrics = DOCUMENTATION_FILES.map((definition) =>
      this.createMetric(files, definition),
    );
    const score = this.round(
      metrics.reduce(
        (total, metric) => total + metric.normalizedScore * metric.weight,
        0,
      ),
    );
    const found = metrics.filter((metric) => metric.rawValue.present).length;

    return {
      score,
      summary: `${found} of ${metrics.length} baseline documentation files found.`,
      metrics,
    };
  }

  private createMetric(
    files: SourceCraftTreeEntry[],
    definition: (typeof DOCUMENTATION_FILES)[number],
  ): DocumentationMetric {
    const match = files.find((file) => definition.pattern.test(file.name));
    const present = Boolean(match);

    return {
      key: definition.key,
      rawValue: { present, ...(match ? { path: match.path } : {}) },
      normalizedScore: present ? 100 : 0,
      weight: definition.weight,
      source: 'sourcecraft.repository_tree',
      explanation: present
        ? `${definition.label} found at ${match?.path}.`
        : `${definition.label} was not found in the repository tree.`,
      evidence: match ? [{ label: definition.label, path: match.path }] : [],
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
