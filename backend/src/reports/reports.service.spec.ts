import { AnalysesService } from '../analyses/analyses.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const analysis = {
    id: 'analysis-1',
    score: 82,
    potentialScore: 94,
    dataCoverage: 100,
    methodology: 'v1',
    repository: {
      name: 'Демонстрационный проект',
      ownerSlug: 'team',
      slug: 'demo',
      webUrl: 'https://sourcecraft.dev/team/demo',
    },
    categories: [
      {
        category: 'DOCUMENTATION',
        score: 85,
        weight: 0.15,
        status: 'AVAILABLE',
        summary: '3 of 4 documentation files found.',
        metrics: [
          {
            key: 'readme',
            normalizedScore: 100,
            explanation: 'README found.',
          },
        ],
      },
    ],
    recommendations: [
      {
        priority: 'HIGH',
        title: 'Add a security policy',
        problem: 'SECURITY.md is missing.',
        rationale: 'Clear reporting process.',
        action: 'Create SECURITY.md.',
        expectedScoreDelta: 7,
      },
    ],
  };
  const analyses = {
    findById: jest.fn().mockResolvedValue(analysis),
  } as unknown as AnalysesService;
  const service = new ReportsService(analyses);

  it('creates a readable Markdown report', async () => {
    const report = await service.markdown('analysis-1');
    expect(report).toContain('# Repo Health Report: Демонстрационный проект');
    expect(report).toContain('**82/100 (Good)**');
    expect(report).toContain('Add a security policy');
  });

  it('creates a PDF with embedded Cyrillic-capable fonts', async () => {
    const report = await service.renderPdf(analysis as never);
    expect(report.subarray(0, 5).toString()).toBe('%PDF-');
    expect(report.length).toBeGreaterThan(5_000);
  });
});
