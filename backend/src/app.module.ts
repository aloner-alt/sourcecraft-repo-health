import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ScoringModule],
  controllers: [HealthController],
})
export class AppModule {}
