import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { ScoringModule } from './scoring/scoring.module';
import { PrismaModule } from './database/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { AnalysesModule } from './analyses/analyses.module';
import { SourceCraftModule } from './sourcecraft/sourcecraft.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    PrismaModule,
    SourceCraftModule,
    RepositoriesModule,
    AnalysesModule,
    ScoringModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
