import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisTrigger } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class StartAnalysisDto {
  @ApiPropertyOptional({ enum: AnalysisTrigger, default: AnalysisTrigger.MANUAL })
  @IsOptional()
  @IsEnum(AnalysisTrigger)
  trigger: AnalysisTrigger = AnalysisTrigger.MANUAL;
}
