import { describe, it, expect, beforeEach } from 'vitest';
import { MarketDenoiserService } from './market-denoiser.service';

describe('MarketDenoiserService', () => {
  let service: MarketDenoiserService;

  beforeEach(() => {
    service = new MarketDenoiserService();
  });

  it('should detect stock outperformance (+3.0% Alpha) during a macro market sell-off', () => {
    // Market NIFTY 50 fell -4.0%, stock fell -1.0%, Beta = 1.0
    // Expected move = 1.0 * -4.0% = -4.0%
    // Relative Alpha = -1.0% - (-4.0%) = +3.0%
    const result = service.calculateRelativeSignal(-1.0, -4.0, 1.0, 'NIFTY 50');

    expect(result.isMarketNormalized).toBe(true);
    expect(result.expectedMovePct).toBe(-4.0);
    expect(result.relativeAlphaPct).toBe(3.0);
    expect(result.rationale).toContain('Outperformed NIFTY 50 (+3.0% Alpha)');
  });

  it('should detect stock underperformance (-3.0% Alpha) during a bull market rally', () => {
    // Market NIFTY 50 gained +4.0%, stock gained +1.0%, Beta = 1.0
    // Expected move = 1.0 * +4.0% = +4.0%
    // Relative Alpha = +1.0% - (+4.0%) = -3.0%
    const result = service.calculateRelativeSignal(1.0, 4.0, 1.0, 'NIFTY 50');

    expect(result.isMarketNormalized).toBe(true);
    expect(result.expectedMovePct).toBe(4.0);
    expect(result.relativeAlphaPct).toBe(-3.0);
    expect(result.rationale).toContain('Lagged NIFTY 50 (-3.0% Alpha)');
  });

  it('should clamp high Beta micro-caps to upper bound of 2.5', () => {
    // Beta = 4.5 should be clamped to 2.5
    // Benchmark NIFTY = -2.0% -> Expected move = 2.5 * -2.0 = -5.0%
    const result = service.calculateRelativeSignal(-2.0, -2.0, 4.5, 'NIFTY 50');

    expect(result.beta).toBe(2.5);
    expect(result.expectedMovePct).toBe(-5.0);
    expect(result.relativeAlphaPct).toBe(3.0);
  });

  it('should gracefully degrade when benchmark index data is unavailable', () => {
    const result = service.calculateRelativeSignal(2.5, null, 1.2, 'NIFTY 50');

    expect(result.isMarketNormalized).toBe(false);
    expect(result.relativeAlphaPct).toBe(0);
    expect(result.rationale).toContain('Benchmark data unavailable');
  });
});
