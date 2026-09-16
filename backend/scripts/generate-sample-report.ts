import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ReportsService } from '../src/reports/reports.service';

const categories = [
  ['SECURITY', 65, 0.2, '3 of 4 baseline security-hygiene checks passed.'],
  ['ACTIVITY', 100, 0.15, 'Last repository activity was 2 days ago.'],
  ['DOCUMENTATION', 85, 0.15, '3 of 4 baseline documentation files found.'],
  ['CI_CD', 70, 0.15, '12 CI/CD runs analyzed with 75% success.'],
  ['ISSUES', 74, 0.15, '24 issues analyzed; 6 open and 2 stale.'],
  ['CODE_HEALTH', 80, 0.2, '3 of 4 engineering practices detected.'],
].map(([category, score, weight, summary]) => ({
  category,
  score,
  weight,
  status: 'AVAILABLE',
  summary,
  metrics: [],
}));

const recommendations = [
  ['HIGH', 'Add a security policy', 'Create SECURITY.md with a private reporting process.', 7],
  ['HIGH', 'Stabilize CI/CD runs', 'Fix recurring failures and rerun the pipeline.', 6],
  ['MEDIUM', 'Review stale issues', 'Close obsolete issues or publish the next action.', 4],
  ['MEDIUM', 'Automate dependency updates', 'Configure Renovate or Dependabot.', 3],
  ['MEDIUM', 'Add CODEOWNERS', 'Assign maintainers to important paths.', 2.5],
  ['LOW', 'Improve issue descriptions', 'Add context and acceptance criteria.', 1.5],
].map(([priority, title, action, expectedScoreDelta]) => ({
  priority,
  title,
  action,
  expectedScoreDelta,
  problem: `${title} is currently missing or below target.`,
  rationale: 'This change improves repository maintainability.',
}));

const analysis = {
  id: 'sample-analysis',
  score: 79.2,
  potentialScore: 94.7,
  dataCoverage: 100,
  methodology: 'v1',
  repository: {
    name: 'Демонстрационный репозиторий',
    ownerSlug: 'sourcecraft-demo',
    slug: 'repo-health',
    webUrl: 'https://sourcecraft.dev/sourcecraft-demo/repo-health',
  },
  categories,
  recommendations,
};

async function main(): Promise<void> {
  const service = new ReportsService({} as never);
  const outputDirectory = join(process.cwd(), 'output', 'pdf');
  await mkdir(outputDirectory, { recursive: true });
  const pdf = await service.renderPdf(analysis as never);
  await writeFile(join(outputDirectory, 'sample-repo-health-report.pdf'), pdf);
}

void main();
