import { Module } from '@nestjs/common';
import { SourceCraftModule } from '../sourcecraft/sourcecraft.module';
import { DocumentationCollector } from './documentation/documentation.collector';
import { IssuesCollector } from './issues/issues.collector';
import { ActivityCollector } from './activity/activity.collector';
import { CiCdCollector } from './cicd/cicd.collector';
import { SecurityCollector } from './security/security.collector';
import { RepositoryTreeProvider } from './repository-tree.provider';
import { CodeHealthCollector } from './code-health/code-health.collector';

@Module({
  imports: [SourceCraftModule],
  providers: [RepositoryTreeProvider, DocumentationCollector, IssuesCollector, ActivityCollector, CiCdCollector, SecurityCollector, CodeHealthCollector],
  exports: [DocumentationCollector, IssuesCollector, ActivityCollector, CiCdCollector, SecurityCollector, CodeHealthCollector],
})
export class CollectorsModule {}
