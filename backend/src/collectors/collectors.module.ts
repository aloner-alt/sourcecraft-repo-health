import { Module } from '@nestjs/common';
import { SourceCraftModule } from '../sourcecraft/sourcecraft.module';
import { DocumentationCollector } from './documentation/documentation.collector';
import { IssuesCollector } from './issues/issues.collector';
import { ActivityCollector } from './activity/activity.collector';

@Module({
  imports: [SourceCraftModule],
  providers: [DocumentationCollector, IssuesCollector, ActivityCollector],
  exports: [DocumentationCollector, IssuesCollector, ActivityCollector],
})
export class CollectorsModule {}
