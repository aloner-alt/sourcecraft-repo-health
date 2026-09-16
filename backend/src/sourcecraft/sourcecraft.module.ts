import { Module } from '@nestjs/common';
import { SourceCraftClient } from './sourcecraft.client';

@Module({
  providers: [SourceCraftClient],
  exports: [SourceCraftClient],
})
export class SourceCraftModule {}
