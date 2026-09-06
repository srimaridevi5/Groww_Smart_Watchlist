import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketDataService } from './market-data.service';
import { MarketDataController } from './market-data.controller';
import { QuoteResolverService } from './quote-resolver.service';
import { TwelveDataMarketDataProvider } from './providers/twelvedata.provider';
import { AlphaVantageMarketDataProvider } from './providers/alphavantage.provider';
import { MockMarketDataProvider } from './providers/mock.provider';

@Module({
  imports: [ConfigModule],
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    QuoteResolverService,
    TwelveDataMarketDataProvider,
    AlphaVantageMarketDataProvider,
    MockMarketDataProvider,
  ],
  exports: [MarketDataService, QuoteResolverService],
})
export class MarketDataModule {}
