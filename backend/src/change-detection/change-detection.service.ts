import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketQuote } from '../market-data/providers/market-data-provider.interface';
import { MarketDenoiserService, RelativeSignalResult } from './market-denoiser.service';

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
  lastVisitAt: Date;
  quoteConfidence: number;
  dataProvider: string;
  isDelayed: boolean;
  // Market De-Noising & Benchmark Alpha Fields
  beta: number;
  expectedMovePct: number;
  relativeAlphaPct: number;
  isMarketNormalized: boolean;
  benchmarkSymbol: string;
  benchmarkChangePct: number;
}

@Injectable()
export class ChangeDetectionService {
  private readonly logger = new Logger(ChangeDetectionService.name);

  constructor(
    private prisma: PrismaService,
    private marketDataService: MarketDataService,
    private marketDenoiserService: MarketDenoiserService,
  ) {}

  /**
   * Calculates normalized Change Score (0.00 - 1.00) for a stock compared to baseline snapshot,
   * incorporating Market De-Noising and Relative Alpha against Benchmark Index.
   */
  calculateChangeSignal(
    currentQuote: MarketQuote,
    baseline: { price: number; volume: number; volatility?: number; fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number },
    relativeSignal?: RelativeSignalResult
  ): {
    changeScore: number;
    severityTier: 'HIGH_ATTENTION' | 'SIGNIFICANT' | 'NOTEWORTHY' | 'NORMAL';
    technicalSignal: 'NEW_52W_HIGH' | 'NEW_52W_LOW' | 'NEAR_52W_HIGH' | 'NEAR_52W_LOW' | 'NONE';
    reasons: string[];
    priceChangePct: number;
    volumeRatio: number;
    volatilityZScore: number;
  } {
    const priceChangePct = ((currentQuote.price - baseline.price) / baseline.price) * 100;
    const absPriceChangePct = Math.abs(priceChangePct);

    // 1. De-Noised Price Score (Normalized 0.0 - 1.0)
    // Combines raw percentage move (40%) and Beta-Adjusted Relative Alpha (60%)
    const rawPriceScore = Math.min(1.0, absPriceChangePct / 10.0);
    const alphaScore = relativeSignal ? relativeSignal.normalizedAlphaScore : rawPriceScore;
    const priceScore = Number((0.60 * alphaScore + 0.40 * rawPriceScore).toFixed(2));

    // 2. Volume Score (Normalized 0.0 - 1.0)
    const avgVol = currentQuote.avgVolume20d || baseline.volume || 1000000;
    const volumeRatio = currentQuote.volume / avgVol;
    const volumeScore = Math.min(1.0, Math.max(0.0, (volumeRatio - 1.0) / 3.0));

    // 3. Volatility Z-Score (Normalized 0.0 - 1.0)
    const stockVolatility = baseline.volatility || 0.02; // default 2% daily std dev
    const dailyReturnPct = absPriceChangePct / 100.0;
    const volatilityZScore = dailyReturnPct / stockVolatility;
    const volatilityScore = Math.min(1.0, Math.max(0.0, volatilityZScore / 3.0));

    // 4. Technical 52-Week Signals (4 Distinct Tiers)
    let technicalSignal: 'NEW_52W_HIGH' | 'NEW_52W_LOW' | 'NEAR_52W_HIGH' | 'NEAR_52W_LOW' | 'NONE' = 'NONE';
    let technicalScore = 0.0;

    const high52w = baseline.fiftyTwoWeekHigh || currentQuote.fiftyTwoWeekHigh;
    const low52w = baseline.fiftyTwoWeekLow || currentQuote.fiftyTwoWeekLow;

    if (currentQuote.price > high52w) {
      technicalSignal = 'NEW_52W_HIGH';
      technicalScore = 1.0;
    } else if (currentQuote.price < low52w) {
      technicalSignal = 'NEW_52W_LOW';
      technicalScore = 1.0;
    } else if (currentQuote.price >= high52w * 0.98) {
      technicalSignal = 'NEAR_52W_HIGH';
      technicalScore = 0.6;
    } else if (currentQuote.price <= low52w * 1.02) {
      technicalSignal = 'NEAR_52W_LOW';
      technicalScore = 0.6;
    }

    // Weighted Normalized Formula: Price (40%), Volume (25%), Volatility (20%), Technical (15%)
    const rawScore =
      0.40 * priceScore +
      0.25 * volumeScore +
      0.20 * volatilityScore +
      0.15 * technicalScore;

    const changeScore = Number(Math.min(1.0, Math.max(0.0, rawScore)).toFixed(2));

    // Severity Categorization
    let severityTier: 'HIGH_ATTENTION' | 'SIGNIFICANT' | 'NOTEWORTHY' | 'NORMAL' = 'NORMAL';
    if (changeScore >= 0.80) {
      severityTier = 'HIGH_ATTENTION';
    } else if (changeScore >= 0.60) {
      severityTier = 'SIGNIFICANT';
    } else if (changeScore >= 0.30) {
      severityTier = 'NOTEWORTHY';
    }

    // Generate Actionable Reasons (Macro Context First)
    const reasons: string[] = [];

    if (relativeSignal && relativeSignal.isMarketNormalized) {
      reasons.push(relativeSignal.rationale);
    } else if (absPriceChangePct >= 1.5) {
      const sign = priceChangePct >= 0 ? '+' : '';
      reasons.push(`${sign}${priceChangePct.toFixed(1)}% price move since last visit`);
    }

    if (volumeRatio >= 1.75) {
      reasons.push(`Volume surge (${volumeRatio.toFixed(1)}x 20d avg)`);
    }

    if (volatilityZScore >= 2.0) {
      reasons.push(`High volatility move (Z-score ${volatilityZScore.toFixed(1)})`);
    }

    if (technicalSignal === 'NEW_52W_HIGH') {
      reasons.push(`New 52-Week High breakout`);
    } else if (technicalSignal === 'NEW_52W_LOW') {
      reasons.push(`New 52-Week Low breakdown`);
    } else if (technicalSignal === 'NEAR_52W_HIGH') {
      reasons.push(`Near 52-Week High (within 2%)`);
    } else if (technicalSignal === 'NEAR_52W_LOW') {
      reasons.push(`Near 52-Week Low (within 2%)`);
    }

    if (reasons.length === 0) {
      reasons.push('Trading within normal parameters');
    }

    return {
      changeScore,
      severityTier,
      technicalSignal,
      reasons,
      priceChangePct: Number(priceChangePct.toFixed(2)),
      volumeRatio: Number(volumeRatio.toFixed(2)),
      volatilityZScore: Number(volatilityZScore.toFixed(2)),
    };
  }

  /**
   * Computes watchlist changes since user's last visit snapshot with De-Noised Relative Alpha signals.
   */
  async getWatchlistChanges(userId: string, watchlistId: string): Promise<ChangeAnalysisResult[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
      include: { items: true },
    });

    if (!watchlist || watchlist.items.length === 0) return [];

    const stockSymbols = watchlist.items.map((item) => item.stockSymbol);
    const benchmarkSymbol = 'NIFTY';
    const allSymbolsToFetch = Array.from(new Set([...stockSymbols, benchmarkSymbol]));

    const quotes = await this.marketDataService.getQuotes(allSymbolsToFetch);
    const benchmarkQuote = quotes[benchmarkSymbol] || null;

    // Fetch stock master records to retrieve Beta values
    const stockMasters = await this.prisma.stockMaster.findMany({
      where: { symbol: { in: stockSymbols } },
    });
    const betaMap = new Map<string, number>();
    for (const sm of stockMasters) {
      betaMap.set(sm.symbol, sm.beta ?? 1.0);
    }

    // Fetch user's previous visit snapshots for this watchlist (plus benchmark index snapshot)
    const snapshots = await this.prisma.userVisitSnapshot.findMany({
      where: {
        userId,
        watchlistId,
      },
      orderBy: { capturedAt: 'desc' },
    });

    // Map latest snapshot per stock symbol
    const snapshotMap = new Map<string, typeof snapshots[0]>();
    for (const snap of snapshots) {
      if (!snapshotMap.has(snap.stockSymbol)) {
        snapshotMap.set(snap.stockSymbol, snap);
      }
    }

    // Calculate NIFTY 50 Benchmark move % since baseline
    let benchmarkChangePct: number | null = null;
    if (benchmarkQuote) {
      const benchmarkSnapshot = snapshotMap.get(benchmarkSymbol);
      const benchmarkBaselinePrice = benchmarkSnapshot
        ? benchmarkSnapshot.price
        : benchmarkQuote.price - benchmarkQuote.change24h;
      if (benchmarkBaselinePrice > 0) {
        benchmarkChangePct = ((benchmarkQuote.price - benchmarkBaselinePrice) / benchmarkBaselinePrice) * 100;
      }
    }

    const results: ChangeAnalysisResult[] = [];

    for (const symbol of stockSymbols) {
      const quote = quotes[symbol];
      if (!quote) continue;

      const snapshot = snapshotMap.get(symbol);
      const beta = betaMap.get(symbol) ?? 1.0;

      // Baseline price fallback: if no snapshot exists, use yesterday's quote or current price - change24h
      const baselinePrice = snapshot ? snapshot.price : (quote.price - quote.change24h) || quote.price;
      const baselineVolume = snapshot ? snapshot.volume : quote.avgVolume20d;

      const priceChangePct = ((quote.price - baselinePrice) / baselinePrice) * 100;

      // Calculate Beta-Adjusted Relative Signal
      const relativeSignal = this.marketDenoiserService.calculateRelativeSignal(
        priceChangePct,
        benchmarkChangePct,
        beta,
        'NIFTY 50'
      );

      const signal = this.calculateChangeSignal(
        quote,
        {
          price: baselinePrice,
          volume: baselineVolume,
          volatility: snapshot?.volatility || 0.02,
          fiftyTwoWeekHigh: snapshot?.fiftyTwoWeekHigh || quote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: snapshot?.fiftyTwoWeekLow || quote.fiftyTwoWeekLow,
        },
        relativeSignal
      );

      results.push({
        symbol,
        name: quote.name || symbol,
        currentPrice: quote.price,
        baselinePrice,
        priceChange: Number((quote.price - baselinePrice).toFixed(2)),
        priceChangePct: signal.priceChangePct,
        changeScore: signal.changeScore,
        severityTier: signal.severityTier,
        technicalSignal: signal.technicalSignal,
        volumeRatio: signal.volumeRatio,
        volatilityZScore: signal.volatilityZScore,
        reasons: signal.reasons,
        lastVisitAt: snapshot ? snapshot.capturedAt : user.lastVisitAt,
        quoteConfidence: quote.confidence,
        dataProvider: quote.provider,
        isDelayed: quote.isDelayed,
        beta: relativeSignal.beta,
        expectedMovePct: relativeSignal.expectedMovePct,
        relativeAlphaPct: relativeSignal.relativeAlphaPct,
        isMarketNormalized: relativeSignal.isMarketNormalized,
        benchmarkSymbol: relativeSignal.benchmarkSymbol,
        benchmarkChangePct: relativeSignal.benchmarkChangePct,
      });
    }

    // Sort by Change Score descending
    return results.sort((a, b) => b.changeScore - a.changeScore);
  }

  /**
   * Captures a session visit snapshot for a user's active watchlist stocks + benchmark index.
   */
  async recordUserVisitSnapshot(userId: string, watchlistId: string): Promise<void> {
    const items = await this.prisma.watchlist.findMany({
      where: { id: watchlistId, userId },
      select: { items: { select: { stockSymbol: true } } },
    });

    if (items.length === 0 || !items[0].items) return;
    const stockSymbols = items[0].items.map((i) => i.stockSymbol);
    const benchmarkSymbol = 'NIFTY';
    const symbolsToSnapshot = Array.from(new Set([...stockSymbols, benchmarkSymbol]));

    const quotes = await this.marketDataService.getQuotes(symbolsToSnapshot);
    const now = new Date();

    for (const symbol of symbolsToSnapshot) {
      const quote = quotes[symbol];
      if (!quote) continue;

      await this.prisma.userVisitSnapshot.create({
        data: {
          userId,
          watchlistId,
          stockSymbol: symbol,
          price: quote.price,
          volume: quote.volume,
          volatility: 0.02,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          capturedAt: now,
          dataTimestamp: new Date(quote.timestamp),
          dataProvider: quote.provider,
          dataConfidence: quote.confidence,
        },
      });
    }

    // Update user's global lastVisitAt
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastVisitAt: now },
    });
  }
}
