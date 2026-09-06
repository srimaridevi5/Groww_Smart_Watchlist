import { Module } from '@nestjs/common';
import { QuoteSyncProcessor } from './quote-sync.processor';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [MarketDataModule],
  providers: [QuoteSyncProcessor],
  exports: [QuoteSyncProcessor],
})
export class JobsModule {}
