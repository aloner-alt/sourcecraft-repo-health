import { Module } from '@nestjs/common';
import { AnalysesController } from './analyses.controller';
import { AnalysesService } from './analyses.service';
import { AnalysisRunnerService } from './analysis-runner.service';
import { CollectorsModule } from '../collectors/collectors.module';
import { ScoringModule } from '../scoring/scoring.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { BullModule } from '@nestjs/bullmq';
import { ANALYSIS_QUEUE } from './analysis-queue.constants';
import { AnalysisQueueService } from './analysis-queue.service';
import { AnalysisProcessor } from './analysis.processor';

@Module({
  imports: [
    CollectorsModule,
    ScoringModule,
    RecommendationsModule,
    BullModule.registerQueue({ name: ANALYSIS_QUEUE }),
  ],
  controllers: [AnalysesController],
  providers: [
    AnalysesService,
    AnalysisRunnerService,
    AnalysisQueueService,
    AnalysisProcessor,
  ],
  exports: [AnalysesService, AnalysisQueueService],
})
export class AnalysesModule {}
