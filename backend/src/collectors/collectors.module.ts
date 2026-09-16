import { Module } from '@nestjs/common';
import { SourceCraftModule } from '../sourcecraft/sourcecraft.module';
import { DocumentationCollector } from './documentation/documentation.collector';
import { IssuesCollector } from './issues/issues.collector';
import { ActivityCollector } from './activity/activity.collector';
import { CiCdCollector } from './cicd/cicd.collector';

@Module({
  imports: [SourceCraftModule],
  providers: [DocumentationCollector, IssuesCollector, ActivityCollector, CiCdCollector],
  exports: [DocumentationCollector, IssuesCollector, ActivityCollector, CiCdCollector],
})
export class CollectorsModule {}
