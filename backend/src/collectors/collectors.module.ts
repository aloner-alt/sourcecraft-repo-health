import { Module } from '@nestjs/common';
import { SourceCraftModule } from '../sourcecraft/sourcecraft.module';
import { DocumentationCollector } from './documentation/documentation.collector';
import { IssuesCollector } from './issues/issues.collector';
import { ActivityCollector } from './activity/activity.collector';
import { CiCdCollector } from './cicd/cicd.collector';
import { SecurityCollector } from './security/security.collector';

@Module({
  imports: [SourceCraftModule],
  providers: [DocumentationCollector, IssuesCollector, ActivityCollector, CiCdCollector, SecurityCollector],
  exports: [DocumentationCollector, IssuesCollector, ActivityCollector, CiCdCollector, SecurityCollector],
})
export class CollectorsModule {}
