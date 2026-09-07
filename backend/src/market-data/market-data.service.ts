import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { HistoricalBar, IMarketDataProvider, MarketQuote } from './providers/market-data-provider.interface';
import { TwelveDataMarketDataProvider } from './providers/twelvedata.provider';
import { AlphaVantageMarketDataProvider } from './providers/alphavantage.provider';
import { MockMarketDataProvider } from './providers/mock.provider';
import { QuoteResolverService } from './quote-resolver.service';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly providers: IMarketDataProvider[];

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    private quoteResolver: QuoteResolverService,
    private twelveData: TwelveDataMarketDataProvider,
    private alphaVantage: AlphaVantageMarketDataProvider,
    private mockProvider: MockMarketDataProvider,
  ) {
    // Real external providers chain
    this.providers = [this.twelveData, this.alphaVantage];
  }

  /**
   * Fetches quote for a single stock symbol with 30s Redis cache.
   */
  async getQuote(symbol: string): Promise<MarketQuote> {
    const cacheKey = `quote:${symbol.toUpperCase()}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // invalid cache
      }
    }

    const candidates: MarketQuote[] = [];

    for (const provider of this.providers) {
      try {
        const q = await provider.getQuote(symbol);
        if (q) candidates.push(q);
      } catch (err: any) {
        this.logger.debug(`Provider ${provider.name} failed for ${symbol}: ${err.message}`);
      }
    }

    // If real providers produced candidate quotes, resolve among them
    let finalQuote: MarketQuote | null = null;
    if (candidates.length > 0) {
      finalQuote = this.quoteResolver.resolveQuote(candidates);
    }

    // Only fallback to mockProvider if all real providers returned null
    if (!finalQuote) {
      finalQuote = (await this.mockProvider.getQuote(symbol))!;
    }

    // Cache quote in Redis/Memory for 30 seconds to respect API rate limits
    await this.redisService.set(cacheKey, JSON.stringify(finalQuote), 30);
    return finalQuote;
  }

  /**
   * Batch fetches quotes for an array of symbols.
   */
  async getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
    if (symbols.length === 0) return {};

    const result: Record<string, MarketQuote> = {};
    const missingSymbols: string[] = [];

    // Check Redis cache first (30s TTL)
    for (const sym of symbols) {
      const cacheKey = `quote:${sym.toUpperCase()}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        try {
          result[sym] = JSON.parse(cached);
          continue;
        } catch {
          // ignore
        }
      }
      missingSymbols.push(sym);
    }

    if (missingSymbols.length === 0) return result;

    // Fetch missing symbols across real providers only
    const candidatesMap = new Map<string, MarketQuote[]>();

    for (const provider of this.providers) {
      try {
        const batchMap = await provider.getQuotes(missingSymbols);
        for (const [sym, quote] of batchMap.entries()) {
          if (!candidatesMap.has(sym)) candidatesMap.set(sym, []);
          candidatesMap.get(sym)!.push(quote);
        }
      } catch (err: any) {
        this.logger.debug(`Provider ${provider.name} batch fetch error: ${err.message}`);
      }
    }

    // Resolve real candidates
    const resolvedMap = this.quoteResolver.resolveBatch(candidatesMap);

    for (const sym of missingSymbols) {
      let quote = resolvedMap.get(sym);
      
      // Fallback to Mock ONLY if real providers failed for this symbol
      if (!quote) {
        quote = (await this.mockProvider.getQuote(sym))!;
      }
      
      result[sym] = quote;
      await this.redisService.set(`quote:${sym.toUpperCase()}`, JSON.stringify(quote), 30);
    }

    return result;
  }

  /**
   * Fetches historical candles for chart drawer.
   */
  async getHistoricalBars(symbol: string): Promise<HistoricalBar[]> {
    try {
      const bars = await this.twelveData.getHistoricalData(symbol);
      if (bars && bars.length > 0) return bars;
    } catch (err: any) {
      this.logger.debug(`TwelveData historical bars fetch error for ${symbol}: ${err.message}`);
    }

    return await this.mockProvider.getHistoricalData(symbol);
  }

}
