import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { ScoringModule } from './scoring/scoring.module';
import { PrismaModule } from './database/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RepositoriesModule,
    ScoringModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
