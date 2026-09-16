import { Module } from '@nestjs/common';
import { SourceCraftModule } from '../sourcecraft/sourcecraft.module';
import { DocumentationCollector } from './documentation/documentation.collector';

@Module({
  imports: [SourceCraftModule],
  providers: [DocumentationCollector],
  exports: [DocumentationCollector],
})
export class CollectorsModule {}
