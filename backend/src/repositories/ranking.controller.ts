import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListRepositoriesQueryDto } from './dto/list-repositories-query.dto';
import { RepositoriesService } from './repositories.service';

@ApiTags('ranking')
@Controller('ranking')
export class RankingController {
  constructor(private readonly repositories: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the public repository ranking' })
  findPublic(@Query() query: ListRepositoriesQueryDto) {
    return this.repositories.findPublic(query);
  }
}
