import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListRepositoriesQueryDto } from './dto/list-repositories-query.dto';
import { RepositoriesService } from './repositories.service';

@ApiTags('repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List and rank public SourceCraft repositories' })
  findPublic(@Query() query: ListRepositoriesQueryDto) {
    return this.repositoriesService.findPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repository details and its latest analysis' })
  findById(@Param('id') id: string) {
    return this.repositoriesService.findById(id);
  }
}
