import { AnalysisStatus, AnalysisTrigger } from '@prisma/client';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AnalysesService } from './analyses.service';

describe('AnalysesService', () => {
  const repository = { findUnique: jest.fn(), update: jest.fn() };
  const analysis = { create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() };
  const prisma = {
    repository,
    analysis,
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  } as unknown as PrismaService;
  const service = new AnalysesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    analysis.findFirst.mockResolvedValue(null);
  });

  it('creates a queued analysis for an existing repository', async () => {
    repository.findUnique.mockResolvedValue({ id: 'repo-1' });
    analysis.create.mockResolvedValue({ id: 'analysis-1', status: AnalysisStatus.QUEUED });

    const result = await service.start('repo-1', AnalysisTrigger.MANUAL);

    expect(result.status).toBe(AnalysisStatus.QUEUED);
  });

  it('rejects an analysis for an unknown repository', async () => {
    repository.findUnique.mockResolvedValue(null);

    await expect(service.start('missing', AnalysisTrigger.MANUAL)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a duplicate active analysis', async () => {
    repository.findUnique.mockResolvedValue({ id: 'repo-1' });
    analysis.findFirst.mockResolvedValue({ id: 'active-1' });
    await expect(service.start('repo-1', AnalysisTrigger.MANUAL)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects invalid status transitions', async () => {
    analysis.findUnique.mockResolvedValue({
      id: 'analysis-1',
      repositoryId: 'repo-1',
      status: AnalysisStatus.COMPLETED,
    });

    await expect(service.markCollecting('analysis-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
