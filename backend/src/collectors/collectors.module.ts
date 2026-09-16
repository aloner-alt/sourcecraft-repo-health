import { Module } from '@nestjs/common';
import { SourceCraftModule } from '../sourcecraft/sourcecraft.module';
import { DocumentationCollector } from './documentation/documentation.collector';
import { IssuesCollector } from './issues/issues.collector';

@Module({
  imports: [SourceCraftModule],
  providers: [DocumentationCollector, IssuesCollector],
  exports: [DocumentationCollector, IssuesCollector],
})
export class CollectorsModule {}
