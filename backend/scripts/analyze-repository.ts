import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AnalysisStatus, AnalysisTrigger } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { AnalysesService } from '../src/analyses/analyses.service';
import { AnalysisQueueService } from '../src/analyses/analysis-queue.service';
import { RepositoriesService } from '../src/repositories/repositories.service';

const POLL_INTERVAL_MS = 1_000;
const TIMEOUT_MS = 5 * 60_000;

function requiredArgument(index: number, name: string): string {
  const value = process.argv[index]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Usage: pnpm analyze:repo <organization> <repository>`,
    );
  }
  return value;
}

async function waitForAnalysis(
  analyses: AnalysesService,
  analysisId: string,
) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const analysis = await analyses.findById(analysisId);
    if (
      analysis.status === AnalysisStatus.COMPLETED ||
      analysis.status === AnalysisStatus.FAILED
    ) {
      return analysis;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Analysis ${analysisId} did not finish within five minutes.`);
}

async function main(): Promise<void> {
  const organizationSlug = requiredArgument(2, 'organization');
  const repositorySlug = requiredArgument(3, 'repository');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const repositories = app.get(RepositoriesService);
    const queue = app.get(AnalysisQueueService);
    const analyses = app.get(AnalysesService);

    const repository = await repositories.syncFromSourceCraft(
      organizationSlug,
      repositorySlug,
    );
    const queued = await queue.start(repository.id, AnalysisTrigger.MANUAL);
    const completed = await waitForAnalysis(analyses, queued.id);

    process.stdout.write(
      `${JSON.stringify(
        {
          repository: `${repository.ownerSlug}/${repository.slug}`,
          repositoryId: repository.id,
          analysisId: completed.id,
          status: completed.status,
          score: completed.score,
          potentialScore: completed.potentialScore,
          dataCoverage: completed.dataCoverage,
          categoryCount: completed.categories.length,
          recommendationCount: completed.recommendations.length,
          ...(completed.errorCode
            ? {
                errorCode: completed.errorCode,
                errorMessage: completed.errorMessage,
              }
            : {}),
        },
        null,
        2,
      )}\n`,
    );

    if (completed.status === AnalysisStatus.FAILED) process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
