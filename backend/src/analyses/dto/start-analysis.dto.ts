import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisTrigger } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';

export class StartAnalysisDto {
  @ApiPropertyOptional({ enum: [AnalysisTrigger.MANUAL, AnalysisTrigger.REANALYSIS], default: AnalysisTrigger.MANUAL })
  @IsOptional()
  @IsIn([AnalysisTrigger.MANUAL, AnalysisTrigger.REANALYSIS])
  trigger: AnalysisTrigger = AnalysisTrigger.MANUAL;
}
