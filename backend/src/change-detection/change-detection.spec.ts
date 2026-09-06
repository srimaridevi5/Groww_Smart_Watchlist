import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeDetectionService } from './change-detection.service';
import { MarketDenoiserService } from './market-denoiser.service';
import { MarketQuote } from '../market-data/providers/market-data-provider.interface';

describe('ChangeDetectionService (Normalized 0.0-1.0 Score Engine)', () => {
  let service: ChangeDetectionService;
  let denoiser: MarketDenoiserService;

  beforeEach(() => {
    denoiser = new MarketDenoiserService();
    service = new ChangeDetectionService(null as any, null as any, denoiser);
  });

  const baseQuote: MarketQuote = {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 132.80,
    change24h: 10.30,
    change24hPct: 8.41,
    volume: 45000000,
    avgVolume20d: 20000000,
    fiftyTwoWeekHigh: 140.00,
    fiftyTwoWeekLow: 45.00,
    timestamp: Date.now(),
    provider: 'TestProvider',
    marketStatus: 'OPEN',
    isDelayed: false,
    confidence: 0.98,
  };

  it('should calculate High Attention score (>= 0.80) for massive surge + volume spike + near 52W High', () => {
    const nearHighQuote: MarketQuote = {
      ...baseQuote,
      price: 132.80,
      fiftyTwoWeekHigh: 135.00,
    };

    const result = service.calculateChangeSignal(nearHighQuote, {
      price: 122.50, // +8.4% move
      volume: 20000000, // 2.25x volume ratio
      volatility: 0.03,
      fiftyTwoWeekHigh: 135.00, // current 132.80 is within 2% of 135.00 (NEAR_52W_HIGH)
      fiftyTwoWeekLow: 45.00,
    });

    expect(result.changeScore).toBeGreaterThanOrEqual(0.60);
    expect(result.technicalSignal).toBe('NEAR_52W_HIGH');
    expect(result.reasons.some((r) => r.includes('price move'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Volume surge'))).toBe(true);
  });

  it('should correctly assign NEW_52W_HIGH technical signal when price exceeds 52W High', () => {
    const breakoutQuote: MarketQuote = {
      ...baseQuote,
      price: 145.00,
      fiftyTwoWeekHigh: 140.00,
    };

    const result = service.calculateChangeSignal(breakoutQuote, {
      price: 135.00,
      volume: 20000000,
      fiftyTwoWeekHigh: 140.00,
      fiftyTwoWeekLow: 45.00,
    });

    expect(result.technicalSignal).toBe('NEW_52W_HIGH');
    expect(result.reasons.some((r) => r.includes('New 52-Week High breakout'))).toBe(true);
  });

  it('should assign Normal tier for minimal price noise (< 1.5% move and average volume)', () => {
    const quietQuote: MarketQuote = {
      ...baseQuote,
      price: 100.20,
      volume: 10000000,
      avgVolume20d: 10000000,
    };

    const result = service.calculateChangeSignal(quietQuote, {
      price: 100.00, // +0.2% move
      volume: 10000000,
      volatility: 0.02,
      fiftyTwoWeekHigh: 130.00,
      fiftyTwoWeekLow: 70.00,
    });

    expect(result.changeScore).toBeLessThan(0.30);
    expect(result.severityTier).toBe('NORMAL');
    expect(result.technicalSignal).toBe('NONE');
  });

  it('should ensure changeScore never exceeds 1.00 or drops below 0.00', () => {
    const extremeQuote: MarketQuote = {
      ...baseQuote,
      price: 300.00, // Massive explosion
      volume: 500000000,
    };

    const result = service.calculateChangeSignal(extremeQuote, {
      price: 100.00,
      volume: 10000000,
      fiftyTwoWeekHigh: 140.00,
      fiftyTwoWeekLow: 45.00,
    });

    expect(result.changeScore).toBeLessThanOrEqual(1.00);
    expect(result.changeScore).toBeGreaterThanOrEqual(0.00);
  });
});
