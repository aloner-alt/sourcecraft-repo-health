import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum RepositorySortBy {
  SCORE = 'score',
  LIKES = 'likes',
  LAST_ACTIVITY = 'lastActivity',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListRepositoriesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by primary programming language.' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ enum: RepositorySortBy, default: RepositorySortBy.SCORE })
  @IsOptional()
  @IsEnum(RepositorySortBy)
  sortBy: RepositorySortBy = RepositorySortBy.SCORE;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset = 0;
}
