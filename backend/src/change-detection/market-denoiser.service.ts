import { Injectable, Logger } from '@nestjs/common';

export interface RelativeSignalResult {
  beta: number;
  expectedMovePct: number;
  relativeAlphaPct: number;
  normalizedAlphaScore: number; // 0.00 to 1.00
  rationale: string;
  isMarketNormalized: boolean;
  benchmarkSymbol: string;
  benchmarkChangePct: number;
}

@Injectable()
export class MarketDenoiserService {
  private readonly logger = new Logger(MarketDenoiserService.name);

  /**
   * Calculates Beta-Adjusted Relative Alpha against a Benchmark Index (e.g. NIFTY 50)
   */
  calculateRelativeSignal(
    stockChangePct: number,
    benchmarkChangePct: number | null,
    beta: number = 1.0,
    benchmarkSymbol: string = 'NIFTY 50'
  ): RelativeSignalResult {
    // Edge Case Handle 1: Missing or degraded benchmark index quote
    if (benchmarkChangePct === null || isNaN(benchmarkChangePct)) {
      this.logger.warn(`Benchmark data unavailable for ${benchmarkSymbol}. Falling back to unadjusted signals.`);
      return {
        beta: 1.0,
        expectedMovePct: stockChangePct,
        relativeAlphaPct: 0,
        normalizedAlphaScore: Math.min(1.0, Math.abs(stockChangePct) / 10.0),
        rationale: `${stockChangePct >= 0 ? '+' : ''}${stockChangePct.toFixed(1)}% price move (Benchmark data unavailable)`,
        isMarketNormalized: false,
        benchmarkSymbol,
        benchmarkChangePct: 0,
      };
    }

    // Edge Case Handle 2: Clamp extreme beta values to [0.2, 2.5] to prevent score explosion on micro-caps
    const safeBeta = Number(Math.min(2.5, Math.max(0.2, beta || 1.0)).toFixed(2));

    // Expected move based on CAPM Beta relationship
    const expectedMovePct = Number((safeBeta * benchmarkChangePct).toFixed(2));

    // Relative Alpha = Actual Stock Move % - Expected Stock Move %
    const relativeAlphaPct = Number((stockChangePct - expectedMovePct).toFixed(2));
    const absAlpha = Math.abs(relativeAlphaPct);

    // Normalize Alpha score into 0.00 - 1.00 scale (8% alpha yields max score 1.0)
    const normalizedAlphaScore = Number(Math.min(1.0, absAlpha / 8.0).toFixed(2));

    // Generate Context-Aware Macro Rationale
    let rationale = '';

    if (benchmarkChangePct <= -1.0 && relativeAlphaPct >= 0.8) {
      rationale = `⚡ Outperformed ${benchmarkSymbol} (+${relativeAlphaPct.toFixed(1)}% Alpha) despite market drop (${benchmarkSymbol} ${benchmarkChangePct.toFixed(1)}%)`;
    } else if (benchmarkChangePct >= 1.0 && relativeAlphaPct <= -0.8) {
      rationale = `⚠️ Lagged ${benchmarkSymbol} (${relativeAlphaPct.toFixed(1)}% Alpha) during market rally (${benchmarkSymbol} +${benchmarkChangePct.toFixed(1)}%)`;
    } else if (relativeAlphaPct >= 1.5) {
      rationale = `🚀 Strong Alpha Generation (+${relativeAlphaPct.toFixed(1)}% vs expected ${expectedMovePct >= 0 ? '+' : ''}${expectedMovePct.toFixed(1)}%)`;
    } else if (relativeAlphaPct <= -1.5) {
      rationale = `🔻 Underperformed Beta Expectation (${relativeAlphaPct.toFixed(1)}% Alpha vs expected ${expectedMovePct >= 0 ? '+' : ''}${expectedMovePct.toFixed(1)}%)`;
    } else {
      rationale = `Trading in line with ${benchmarkSymbol} market movement (${stockChangePct >= 0 ? '+' : ''}${stockChangePct.toFixed(1)}%)`;
    }

    return {
      beta: safeBeta,
      expectedMovePct,
      relativeAlphaPct,
      normalizedAlphaScore,
      rationale,
      isMarketNormalized: true,
      benchmarkSymbol,
      benchmarkChangePct: Number(benchmarkChangePct.toFixed(2)),
    };
  }
}
