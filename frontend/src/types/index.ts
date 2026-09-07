export interface User {
  id: string;
  email: string;
  name: string;
  lastVisitAt?: string;
}

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
  timestamp: number;
  provider: string;
  marketStatus: 'OPEN' | 'CLOSED' | 'EXTENDED';
  isDelayed: boolean;
  confidence: number;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockSymbol: string;
  displayOrder: number;
  addedAt: string;
  quote?: MarketQuote | null;
}

export interface Watchlist {
  id: string;
  name: string;
  isDefault: boolean;
  items: WatchlistItem[];
  createdAt: string;
}

export interface ChangeAnalysisResult {
  symbol: string;
  name: string;
  currentPrice: number;
  baselinePrice: number;
  priceChange: number;
  priceChangePct: number;
  changeScore: number; // 0.00 - 1.00
  severityTier: 'HIGH_ATTENTION' | 'SIGNIFICANT' | 'NOTEWORTHY' | 'NORMAL';
  technicalSignal: 'NEW_52W_HIGH' | 'NEW_52W_LOW' | 'NEAR_52W_HIGH' | 'NEAR_52W_LOW' | 'NONE';
  volumeRatio: number;
  volatilityZScore: number;
  reasons: string[];
  lastVisitAt: string;
  quoteConfidence: number;
  dataProvider: string;
  isDelayed: boolean;
  // Market De-Noising & Benchmark Alpha Fields
  beta?: number;
  expectedMovePct?: number;
  relativeAlphaPct?: number;
  isMarketNormalized?: boolean;
  benchmarkSymbol?: string;
  benchmarkChangePct?: number;
  // Optional Time Travel Metadata
  asOfTimestamp?: string;
  isHistorical?: boolean;
}

export interface HistoricalBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SnapshotSession {
  id: string;
  capturedAt: string;
  formattedTime: string;
}

export interface TimePointComparisonResult {
  symbol: string;
  name: string;
  timeA: string;
  timeB: string;
  priceA: number;
  priceB: number;
  priceDelta: number;
  priceDeltaPct: number;
  volumeA: number;
  volumeB: number;
  volumeDeltaPct: number;
  scoreA: number;
  scoreB: number;
  scoreDelta: number;
  alphaA?: number;
  alphaB?: number;
  alphaDelta?: number;
  severityA: 'HIGH_ATTENTION' | 'SIGNIFICANT' | 'NOTEWORTHY' | 'NORMAL';
  severityB: 'HIGH_ATTENTION' | 'SIGNIFICANT' | 'NOTEWORTHY' | 'NORMAL';
  reasons: string[];
}
