import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { MarketDataModule } from './market-data/market-data.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { ChangeDetectionModule } from './change-detection/change-detection.module';
import { JobsModule } from './jobs/jobs.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    MarketDataModule,
    WatchlistModule,
    ChangeDetectionModule,
    JobsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
