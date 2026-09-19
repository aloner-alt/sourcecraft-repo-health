import { DocumentationCollector } from '../collectors/documentation/documentation.collector';
import { IssuesCollector } from '../collectors/issues/issues.collector';
import { ActivityCollector } from '../collectors/activity/activity.collector';
import { CiCdCollector } from '../collectors/cicd/cicd.collector';
import { SecurityCollector } from '../collectors/security/security.collector';
import { CodeHealthCollector } from '../collectors/code-health/code-health.collector';
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
  const activity = { collect: jest.fn() } as unknown as ActivityCollector;
  const cicd = { collect: jest.fn() } as unknown as CiCdCollector;
  const security = { collect: jest.fn() } as unknown as SecurityCollector;
  const codeHealth = { collect: jest.fn() } as unknown as CodeHealthCollector;
  const prisma = {
    categoryResult: { create: jest.fn() },
    recommendation: { create: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  } as unknown as PrismaService;
  const service = new AnalysisRunnerService(
    analyses,
    documentation,
    issues,
    activity,
    cicd,
    security,
    codeHealth,
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
      status: 'AVAILABLE',
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
    (activity.collect as jest.Mock).mockReturnValue({
      score: 100,
      status: 'AVAILABLE',
      summary: 'Last repository activity was 1 day ago.',
      metrics: [],
    });
    (cicd.collect as jest.Mock).mockResolvedValue({
      score: 70,
      status: 'AVAILABLE',
      summary: '2 runs analyzed.',
      metrics: [],
    });
    (security.collect as jest.Mock).mockResolvedValue({ score: 85, status: 'AVAILABLE', summary: '3 of 4 checks.', metrics: [] });
    (codeHealth.collect as jest.Mock).mockResolvedValue({ score: 100, status: 'AVAILABLE', summary: '4 of 4 checks.', metrics: [] });

    const result = await service.run('analysis-1');

    expect(analyses.markCollecting).toHaveBeenCalledWith('analysis-1');
    expect(analyses.markCalculating).toHaveBeenCalledWith('analysis-1');
    expect(prisma.categoryResult.create).toHaveBeenCalled();
    expect(analyses.complete).toHaveBeenCalledWith('analysis-1', {
      score: 80.5,
      potentialScore: 80.5,
      dataCoverage: 100,
    });
    expect(result).toEqual({ id: 'analysis-1', status: 'COMPLETED' });
  });

  it('keeps the analysis usable when one collection source fails', async () => {
    (analyses.findById as jest.Mock).mockResolvedValue({
      repository: { ownerSlug: 'team', slug: 'demo' },
    });
    (documentation.collect as jest.Mock).mockRejectedValue(new Error('API unavailable'));
    (issues.collect as jest.Mock).mockResolvedValue({
      score: null,
      status: 'NO_DATA',
      metrics: [],
    });
    (activity.collect as jest.Mock).mockReturnValue({
      score: null,
      status: 'NO_DATA',
      metrics: [],
    });
    (cicd.collect as jest.Mock).mockResolvedValue({
      score: null,
      status: 'NO_DATA',
      metrics: [],
    });
    (security.collect as jest.Mock).mockResolvedValue({ score: 0, status: 'AVAILABLE', summary: '', metrics: [] });
    (codeHealth.collect as jest.Mock).mockResolvedValue({ score: 0, status: 'AVAILABLE', summary: '', metrics: [] });

    await expect(service.run('analysis-1')).resolves.toBeDefined();
    expect(prisma.categoryResult.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'DOCUMENTATION',
          score: null,
          status: 'COLLECTION_ERROR',
        }),
      }),
    );
    expect(analyses.complete).toHaveBeenCalledWith('analysis-1', {
      score: 0,
      potentialScore: 0,
      dataCoverage: 40,
    });
    expect(analyses.fail).not.toHaveBeenCalled();
  });
});
