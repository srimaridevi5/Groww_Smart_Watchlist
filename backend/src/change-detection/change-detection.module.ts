import { Module } from '@nestjs/common';
import { ChangeDetectionService } from './change-detection.service';
import { ChangeDetectionController } from './change-detection.controller';
import { MarketDenoiserService } from './market-denoiser.service';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [MarketDataModule],
  controllers: [ChangeDetectionController],
  providers: [ChangeDetectionService, MarketDenoiserService],
  exports: [ChangeDetectionService, MarketDenoiserService],
})
export class ChangeDetectionModule {}
