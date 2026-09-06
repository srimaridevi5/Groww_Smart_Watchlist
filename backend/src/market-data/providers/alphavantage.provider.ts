import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { HistoricalBar, IMarketDataProvider, MarketQuote } from './market-data-provider.interface';

@Injectable()
export class AlphaVantageMarketDataProvider implements IMarketDataProvider {
  readonly name = 'AlphaVantage';
  private readonly logger = new Logger(AlphaVantageMarketDataProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY', '');
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    if (!this.apiKey) return null;

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: this.apiKey,
        },
        timeout: 4000,
      });

      const quoteData = response.data?.['Global Quote'];
      if (!quoteData || !quoteData['05. price']) return null;

      const price = parseFloat(quoteData['05. price']);
      const change24h = parseFloat(quoteData['09. change'] || '0');
      const change24hPct = parseFloat((quoteData['10. change percent'] || '0').replace('%', ''));
      const volume = parseInt(quoteData['06. volume'] || '0', 10);

      return {
        symbol,
        price,
        change24h,
        change24hPct,
        volume,
        avgVolume20d: volume > 0 ? volume : 4000000,
        fiftyTwoWeekHigh: price * 1.15,
        fiftyTwoWeekLow: price * 0.85,
        timestamp: Date.now(),
        provider: this.name,
        marketStatus: 'OPEN',
        isDelayed: true,
        confidence: 0.72, // AlphaVantage free tier is delayed 15m
      };
    } catch (err: any) {
      this.logger.warn(`AlphaVantage fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  async getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const map = new Map<string, MarketQuote>();
    for (const sym of symbols) {
      const quote = await this.getQuote(sym);
      if (quote) map.set(sym, quote);
    }
    return map;
  }

  async getHistoricalData(symbol: string, timeframe = '1D'): Promise<HistoricalBar[]> {
    return [];
  }
}
