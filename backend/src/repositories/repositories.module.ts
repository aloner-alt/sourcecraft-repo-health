import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { SourceCraftModule } from '../sourcecraft/sourcecraft.module';
import { RankingController } from './ranking.controller';

@Module({
  imports: [SourceCraftModule],
  controllers: [RepositoriesController, RankingController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}
