import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('quote/:symbol')
  async getQuote(@Param('symbol') symbol: string) {
    return this.marketDataService.getQuote(symbol.toUpperCase());
  }

  @Get('quotes')
  async getQuotes(@Query('symbols') symbolsStr: string) {
    const symbols = symbolsStr ? symbolsStr.split(',').map((s) => s.trim().toUpperCase()) : [];
    return this.marketDataService.getQuotes(symbols);
  }

  @Get('history/:symbol')
  async getHistory(@Param('symbol') symbol: string) {
    return this.marketDataService.getHistoricalBars(symbol.toUpperCase());
  }
}
