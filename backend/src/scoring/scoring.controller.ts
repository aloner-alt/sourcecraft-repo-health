import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CalculateScoreDto } from './dto/calculate-score.dto';
import { ScoringService } from './scoring.service';
import { HealthScoreResult } from './scoring.types';

@ApiTags('scoring')
@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('methodology')
  @ApiOperation({ summary: 'Return the current category weights' })
  @ApiOkResponse({ description: 'Category weights used by the score engine.' })
  getMethodology(): ReturnType<ScoringService['getMethodology']> {
    return this.scoringService.getMethodology();
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate a health score from category scores' })
  @ApiOkResponse({ description: 'Explainable weighted health score.' })
  calculate(@Body() input: CalculateScoreDto): HealthScoreResult {
    return this.scoringService.calculate(input.categories);
  }
}
