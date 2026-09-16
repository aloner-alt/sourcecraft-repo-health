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
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
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
    ReportsModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
