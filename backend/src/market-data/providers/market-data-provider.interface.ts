export interface MarketQuote {
  symbol: string;
  name?: string;
  price: number;
  change24h: number;
  change24hPct: number;
  volume: number;
  avgVolume20d: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  timestamp: number; // Unix epoch ms
  provider: string; // 'TwelveData' | 'AlphaVantage' | 'Mock'
  marketStatus: 'OPEN' | 'CLOSED' | 'EXTENDED';
  isDelayed: boolean;
  confidence: number; // 0.98 (Live), 0.72 (Delayed 15m), 0.35 (Stale >1h), 0.10 (Mock)
}

export interface HistoricalBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IMarketDataProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<MarketQuote | null>;
  getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>>;
  getHistoricalData(symbol: string, timeframe?: string): Promise<HistoricalBar[]>;
}
