import { Injectable, Logger } from '@nestjs/common';
import { MarketQuote } from './providers/market-data-provider.interface';

@Injectable()
export class QuoteResolverService {
  private readonly logger = new Logger(QuoteResolverService.name);

  /**
   * Resolves a single symbol quote across candidate quotes from multiple providers.
   */
  resolveQuote(candidates: MarketQuote[]): MarketQuote | null {
    const validCandidates = candidates.filter((c) => c && c.price > 0);
    if (validCandidates.length === 0) return null;
    if (validCandidates.length === 1) return validCandidates[0];

    // 1. Sort candidates by freshness (timestamp DESC) and provider confidence
    validCandidates.sort((a, b) => {
      // If timestamps differ by more than 1 minute, prefer fresher quote
      const timeDiff = Math.abs(a.timestamp - b.timestamp);
      if (timeDiff > 60 * 1000) {
        return b.timestamp - a.timestamp;
      }
      // Otherwise prefer higher confidence provider
      return b.confidence - a.confidence;
    });

    const primaryQuote = validCandidates[0];

    // 2. Conflict & Divergence Check
    for (let i = 1; i < validCandidates.length; i++) {
      const altQuote = validCandidates[i];
      const priceDiffPct = (Math.abs(primaryQuote.price - altQuote.price) / primaryQuote.price) * 100;

      if (priceDiffPct > 3.0) {
        this.logger.warn(
          `⚠️ Price divergence detected for ${primaryQuote.symbol}: ${primaryQuote.provider} (₹${primaryQuote.price}) vs ${altQuote.provider} (₹${altQuote.price}) - Diff: ${priceDiffPct.toFixed(2)}%`
        );
        // Reduce confidence due to conflict
        primaryQuote.confidence = Math.max(0.20, Number((primaryQuote.confidence * 0.75).toFixed(2)));
      }
    }

    return primaryQuote;
  }

  /**
   * Resolves quotes for multiple symbols.
   */
  resolveBatch(symbolCandidatesMap: Map<string, MarketQuote[]>): Map<string, MarketQuote> {
    const resultMap = new Map<string, MarketQuote>();
    for (const [symbol, candidates] of symbolCandidatesMap.entries()) {
      const resolved = this.resolveQuote(candidates);
      if (resolved) {
        resultMap.set(symbol, resolved);
      }
    }
    return resultMap;
  }
}
