import { Module } from '@nestjs/common';
import { AnalysesController } from './analyses.controller';
import { AnalysesService } from './analyses.service';
import { AnalysisRunnerService } from './analysis-runner.service';
import { CollectorsModule } from '../collectors/collectors.module';
import { ScoringModule } from '../scoring/scoring.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [CollectorsModule, ScoringModule, RecommendationsModule],
  controllers: [AnalysesController],
  providers: [AnalysesService, AnalysisRunnerService],
  exports: [AnalysesService],
})
export class AnalysesModule {}
