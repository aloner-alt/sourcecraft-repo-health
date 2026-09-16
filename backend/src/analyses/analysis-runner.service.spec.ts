import { DocumentationCollector } from '../collectors/documentation/documentation.collector';
import { IssuesCollector } from '../collectors/issues/issues.collector';
import { PrismaService } from '../database/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { AnalysisRunnerService } from './analysis-runner.service';
import { AnalysesService } from './analyses.service';

describe('AnalysisRunnerService', () => {
  const analyses = {
    findById: jest.fn(),
    markCollecting: jest.fn(),
    markCalculating: jest.fn(),
    complete: jest.fn(),
    fail: jest.fn(),
  } as unknown as AnalysesService;
  const documentation = { collect: jest.fn() } as unknown as DocumentationCollector;
  const issues = { collect: jest.fn() } as unknown as IssuesCollector;
  const prisma = {
    categoryResult: { create: jest.fn() },
    recommendation: { create: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  } as unknown as PrismaService;
  const service = new AnalysisRunnerService(
    analyses,
    documentation,
    issues,
    new ScoringService(),
    new RecommendationsService(),
    prisma,
  );

  beforeEach(() => jest.clearAllMocks());

  it('collects documentation, persists evidence, and completes an analysis', async () => {
    (analyses.findById as jest.Mock)
      .mockResolvedValueOnce({
        id: 'analysis-1',
        repository: { ownerSlug: 'team', slug: 'demo' },
      })
      .mockResolvedValueOnce({ id: 'analysis-1', status: 'COMPLETED' });
    (documentation.collect as jest.Mock).mockResolvedValue({
      score: 40,
      summary: '1 of 4 baseline documentation files found.',
      metrics: [
        {
          key: 'readme',
          rawValue: { present: true, path: 'README.md' },
          normalizedScore: 100,
          weight: 0.4,
          source: 'sourcecraft.repository_tree',
          explanation: 'README found at README.md.',
          evidence: [{ label: 'README', path: 'README.md' }],
        },
      ],
    });
    (issues.collect as jest.Mock).mockResolvedValue({
      score: 80,
      status: 'AVAILABLE',
      summary: '10 issues analyzed.',
      metrics: [],
    });

    const result = await service.run('analysis-1');

    expect(analyses.markCollecting).toHaveBeenCalledWith('analysis-1');
    expect(analyses.markCalculating).toHaveBeenCalledWith('analysis-1');
    expect(prisma.categoryResult.create).toHaveBeenCalled();
    expect(analyses.complete).toHaveBeenCalledWith('analysis-1', {
      score: 60,
      potentialScore: 60,
      dataCoverage: 30,
    });
    expect(result).toEqual({ id: 'analysis-1', status: 'COMPLETED' });
  });

  it('marks an analysis as failed when collection fails', async () => {
    (analyses.findById as jest.Mock).mockResolvedValue({
      repository: { ownerSlug: 'team', slug: 'demo' },
    });
    (documentation.collect as jest.Mock).mockRejectedValue(new Error('API unavailable'));
    (issues.collect as jest.Mock).mockResolvedValue({
      score: null,
      status: 'NO_DATA',
      metrics: [],
    });

    await expect(service.run('analysis-1')).rejects.toThrow('API unavailable');
    expect(analyses.fail).toHaveBeenCalledWith(
      'analysis-1',
      'ANALYSIS_FAILED',
      'API unavailable',
    );
  });
});
