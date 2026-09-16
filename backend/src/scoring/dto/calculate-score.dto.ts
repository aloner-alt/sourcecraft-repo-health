import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HealthCategory } from '../scoring.constants';

export class CategoryScoreInputDto {
  @ApiProperty({ enum: HealthCategory, example: HealthCategory.SECURITY })
  @IsEnum(HealthCategory)
  category!: HealthCategory;

  @ApiProperty({
    nullable: true,
    minimum: 0,
    maximum: 100,
    example: 72,
    description: 'Use null when the category has no available data.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  score!: number | null;
}

export class CalculateScoreDto {
  @ApiProperty({ type: [CategoryScoreInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryScoreInputDto)
  categories!: CategoryScoreInputDto[];
}
