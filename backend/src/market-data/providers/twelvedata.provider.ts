import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { HistoricalBar, IMarketDataProvider, MarketQuote } from './market-data-provider.interface';

@Injectable()
export class TwelveDataMarketDataProvider implements IMarketDataProvider {
  readonly name = 'TwelveData';
  private readonly logger = new Logger(TwelveDataMarketDataProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twelvedata.com';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TWELVE_DATA_API_KEY', '');
  }

  private rateLimitedUntil = 0;

  private static readonly INDIAN_NSE_SYMBOLS = new Set(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'TATAMOTORS', 'ICICIBANK']);

  private formatSymbolForApi(symbol: string): string {
    const sym = symbol.toUpperCase();
    if (TwelveDataMarketDataProvider.INDIAN_NSE_SYMBOLS.has(sym)) {
      return `${sym}:NSE`;
    }
    return sym;
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    if (!this.apiKey) return null;
    if (Date.now() < this.rateLimitedUntil) {
      return null; // Silent backoff during rate limit window
    }

    try {
      const apiSymbol = this.formatSymbolForApi(symbol);
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          symbol: apiSymbol,
          apikey: this.apiKey,
        },
        timeout: 4000,
      });

      const data = response.data;
      if (data.status === 'error' || !data.close) {
        if (data.code === 429 || (data.message && data.message.includes('api key'))) {
          this.rateLimitedUntil = Date.now() + 60000;
          this.logger.warn(`⚠️ TwelveData API rate limit reached (8 calls/min free tier). Pausing requests for 60s.`);
        } else {
          this.logger.warn(`TwelveData API returned error for ${symbol}: ${data.message}`);
        }
        return null;
      }

      const price = parseFloat(data.close);
      const change24h = parseFloat(data.change || '0');
      const change24hPct = parseFloat(data.percent_change || '0');
      const volume = parseInt(data.volume || '0', 10);
      const fiftyTwoWeekHigh = parseFloat(data.fifty_two_week?.high || (price * 1.15).toFixed(2));
      const fiftyTwoWeekLow = parseFloat(data.fifty_two_week?.low || (price * 0.85).toFixed(2));
      const isMarketOpen = data.is_market_open ?? true;

      return {
        symbol: symbol.toUpperCase(),
        name: data.name || symbol,
        price,
        change24h,
        change24hPct,
        volume,
        avgVolume20d: volume > 0 ? volume : 5000000,
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
        timestamp: Date.now(),
        provider: this.name,
        marketStatus: isMarketOpen ? 'OPEN' : 'CLOSED',
        isDelayed: false,
        confidence: 0.98, // Real live quote
      };
    } catch (err: any) {
      if (err.response?.status === 429) {
        this.rateLimitedUntil = Date.now() + 60000;
        this.logger.warn(`⚠️ TwelveData API rate limit (429) reached. Pausing live requests for 60s.`);
      } else {
        this.logger.warn(`TwelveData fetch failed for ${symbol}: ${err.message}`);
      }
      return null;
    }
  }

  async getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const map = new Map<string, MarketQuote>();
    if (!this.apiKey || symbols.length === 0) return map;
    if (Date.now() < this.rateLimitedUntil) {
      return map; // Silent backoff during rate limit window
    }

    try {
      const apiSymbolList = symbols.map((s) => this.formatSymbolForApi(s)).join(',');
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          symbol: apiSymbolList,
          apikey: this.apiKey,
        },
        timeout: 5000,
      });

      const data = response.data;
      if (data.code === 429 || data.status === 'error') {
        this.rateLimitedUntil = Date.now() + 60000;
        this.logger.warn(`⚠️ TwelveData batch fetch rate limit (429) reached. Pausing requests for 60s.`);
        return map;
      }

      // Handle single or batch response format
      for (const sym of symbols) {
        const apiSym = this.formatSymbolForApi(sym);
        const item = data[apiSym] || data[sym] || (data.close ? data : null);
        if (item && item.close) {
          const price = parseFloat(item.close);
          map.set(sym.toUpperCase(), {
            symbol: sym.toUpperCase(),
            name: item.name || sym,
            price,
            change24h: parseFloat(item.change || '0'),
            change24hPct: parseFloat(item.percent_change || '0'),
            volume: parseInt(item.volume || '0', 10),
            avgVolume20d: 5000000,
            fiftyTwoWeekHigh: parseFloat(item.fifty_two_week?.high || (price * 1.15).toFixed(2)),
            fiftyTwoWeekLow: parseFloat(item.fifty_two_week?.low || (price * 0.85).toFixed(2)),
            timestamp: Date.now(),
            provider: this.name,
            marketStatus: item.is_market_open ? 'OPEN' : 'CLOSED',
            isDelayed: false,
            confidence: 0.98,
          });
        }
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        this.rateLimitedUntil = Date.now() + 60000;
        this.logger.warn(`⚠️ TwelveData batch fetch rate limit (429) reached. Pausing live requests for 60s.`);
      } else {
        this.logger.warn(`TwelveData batch fetch failed: ${err.message}`);
      }
    }

    return map;
  }

  async getHistoricalData(symbol: string, timeframe = '1D'): Promise<HistoricalBar[]> {
    if (!this.apiKey) return [];

    try {
      const response = await axios.get(`${this.baseUrl}/time_series`, {
        params: {
          symbol,
          interval: '1day',
          outputsize: 30,
          apikey: this.apiKey,
        },
        timeout: 5000,
      });

      const values = response.data?.values;
      if (!Array.isArray(values)) return [];

      return values.map((v: any) => ({
        timestamp: new Date(v.datetime).getTime(),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume || '0', 10),
      })).reverse();
    } catch {
      return [];
    }
  }
}
