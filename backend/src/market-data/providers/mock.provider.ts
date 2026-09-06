import { Injectable, Logger } from '@nestjs/common';
import { HistoricalBar, IMarketDataProvider, MarketQuote } from './market-data-provider.interface';

interface StockMetadata {
  name: string;
  basePrice: number;
  avgVolume20d: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volatility: number;
}

@Injectable()
export class MockMarketDataProvider implements IMarketDataProvider {
  readonly name = 'Mock';
  private readonly logger = new Logger(MockMarketDataProvider.name);

  // Stock metadata dictionary
  private static readonly STOCKS_META: Record<string, StockMetadata> = {
    NIFTY: { name: 'NIFTY 50 Index (Benchmark)', basePrice: 24200.00, avgVolume20d: 500000000, fiftyTwoWeekHigh: 25000.00, fiftyTwoWeekLow: 21000.00, volatility: 0.012 },
    RELIANCE: { name: 'Reliance Industries Ltd.', basePrice: 2995.50, avgVolume20d: 6500000, fiftyTwoWeekHigh: 3024.90, fiftyTwoWeekLow: 2220.30, volatility: 0.018 },
    TCS: { name: 'Tata Consultancy Services', basePrice: 4240.20, avgVolume20d: 2800000, fiftyTwoWeekHigh: 4254.75, fiftyTwoWeekLow: 3310.00, volatility: 0.015 },
    INFY: { name: 'Infosys Limited', basePrice: 1895.00, avgVolume20d: 4500000, fiftyTwoWeekHigh: 1940.00, fiftyTwoWeekLow: 1355.00, volatility: 0.021 },
    HDFCBANK: { name: 'HDFC Bank Limited', basePrice: 1645.80, avgVolume20d: 9200000, fiftyTwoWeekHigh: 1794.00, fiftyTwoWeekLow: 1363.55, volatility: 0.016 },
    TATAMOTORS: { name: 'Tata Motors Limited', basePrice: 1045.00, avgVolume20d: 11000000, fiftyTwoWeekHigh: 1179.00, fiftyTwoWeekLow: 610.00, volatility: 0.028 },
    ICICIBANK: { name: 'ICICI Bank Limited', basePrice: 1230.50, avgVolume20d: 7800000, fiftyTwoWeekHigh: 1257.50, fiftyTwoWeekLow: 898.00, volatility: 0.017 },
    NVDA: { name: 'NVIDIA Corporation', basePrice: 132.80, avgVolume20d: 45000000, fiftyTwoWeekHigh: 140.76, fiftyTwoWeekLow: 45.00, volatility: 0.035 },
    AAPL: { name: 'Apple Inc.', basePrice: 228.50, avgVolume20d: 32000000, fiftyTwoWeekHigh: 237.23, fiftyTwoWeekLow: 164.08, volatility: 0.019 },
    TSLA: { name: 'Tesla, Inc.', basePrice: 218.40, avgVolume20d: 55000000, fiftyTwoWeekHigh: 271.00, fiftyTwoWeekLow: 138.80, volatility: 0.042 },
    MSFT: { name: 'Microsoft Corporation', basePrice: 452.10, avgVolume20d: 21000000, fiftyTwoWeekHigh: 468.35, fiftyTwoWeekLow: 309.45, volatility: 0.016 },
  };

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    const meta = MockMarketDataProvider.STOCKS_META[symbol] || {
      name: `${symbol} Stock`,
      basePrice: 100.0,
      avgVolume20d: 1000000,
      fiftyTwoWeekHigh: 120.0,
      fiftyTwoWeekLow: 80.0,
      volatility: 0.02,
    };

    // Generate minor tick fluctuation around base price
    const now = Date.now();
    const seed = (now / 10000 + symbol.charCodeAt(0)) % 100;
    const tickFactor = Math.sin(seed) * meta.volatility;
    const currentPrice = Number((meta.basePrice * (1 + tickFactor)).toFixed(2));
    
    // Simulate NVDA surge, TCS near 52W High, and NIFTY -3.0% macro dip
    let price = currentPrice;
    let volumeRatio = 1.1;

    if (symbol === 'NIFTY') {
      price = 23474.00; // -3.0% macro market dip from baseline 24200.00
    } else if (symbol === 'NVDA') {
      price = 132.80; // +8.4% jump from baseline 122.50
      volumeRatio = 2.4; // Volume spike
    } else if (symbol === 'TCS') {
      price = 4248.00; // Near 52w High 4254.75
    } else if (symbol === 'TSLA') {
      price = 226.50; // +7.8% jump
      volumeRatio = 2.1;
    }

    const change24h = Number((price - meta.basePrice).toFixed(2));
    const change24hPct = Number(((change24h / meta.basePrice) * 100).toFixed(2));
    const volume = Math.floor(meta.avgVolume20d * volumeRatio);

    return {
      symbol,
      name: meta.name,
      price,
      change24h,
      change24hPct,
      volume,
      avgVolume20d: meta.avgVolume20d,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      timestamp: now,
      provider: this.name,
      marketStatus: 'OPEN',
      isDelayed: false,
      confidence: 0.95, // High confidence mock tick
    };
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
    const quote = await this.getQuote(symbol);
    const basePrice = quote ? quote.price : 100;
    const bars: HistoricalBar[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 30; i >= 0; i--) {
      const ts = now - i * dayMs;
      const noise = Math.sin(i * 0.5 + symbol.length) * 0.03;
      const close = Number((basePrice * (1 + noise)).toFixed(2));
      const open = Number((close * (1 - Math.cos(i) * 0.01)).toFixed(2));
      const high = Math.max(open, close) + Number((Math.abs(Math.sin(i)) * 2).toFixed(2));
      const low = Math.min(open, close) - Number((Math.abs(Math.cos(i)) * 2).toFixed(2));
      const volume = Math.floor(1000000 + Math.random() * 5000000);

      bars.push({ timestamp: ts, open, high, low, close, volume });
    }

    return bars;
  }
}
