'use client';

import React, { useState, useEffect } from 'react';
import { ChangeAnalysisResult, HistoricalBar } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { X, TrendingUp, TrendingDown, Clock, ShieldCheck, Zap, Activity, Award } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface StockDetailDrawerProps {
  stock: ChangeAnalysisResult | null;
  onClose: () => void;
}

export function StockDetailDrawer({ stock, onClose }: StockDetailDrawerProps) {
  const [history, setHistory] = useState<HistoricalBar[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!stock) return;

    setLoadingHistory(true);
    apiClient
      .get(`/market-data/history/${stock.symbol}`)
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [stock]);

  if (!stock) return null;

  const isPositive = stock.priceChangePct >= 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0E121A] border-l border-[#232A3B] h-full overflow-y-auto p-6 text-slate-100 shadow-2xl space-y-6 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#232A3B]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#141822] font-extrabold text-sm text-[#00D09C] border border-[#232A3B]">
              {stock.symbol.substring(0, 3)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {stock.symbol}
                {stock.technicalSignal !== 'NONE' && (
                  <Badge variant="success" className="text-xs">
                    {stock.technicalSignal}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-slate-400">{stock.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Change Severity Spotlight */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-[#141822] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-purple-400" /> Smart Change Score
            </span>
            <span className="font-extrabold text-lg text-purple-300">
              {stock.changeScore.toFixed(2)} / 1.00
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00D09C] via-amber-400 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stock.changeScore * 100)}%` }}
            />
          </div>

          <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
            <span>Severity Level: <strong>{stock.severityTier}</strong></span>
            <span>Data Provider: <strong>{stock.dataProvider}</strong></span>
          </div>
        </div>

        {/* Price Baseline Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#232A3B] bg-[#141822] p-4 space-y-1">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" /> Baseline (Last Visit)
            </div>
            <div className="text-lg font-bold text-slate-200">
              {formatCurrency(stock.baselinePrice, undefined, stock.symbol)}
            </div>
            <div className="text-[11px] text-slate-500">
              Captured: {new Date(stock.lastVisitAt).toLocaleDateString()}
            </div>
          </div>

          <div className="rounded-2xl border border-[#232A3B] bg-[#141822] p-4 space-y-1">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-[#00D09C]" /> Current Market Price
            </div>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {formatCurrency(stock.currentPrice, undefined, stock.symbol)}
              <span className={`text-xs font-bold ${isPositive ? 'text-[#00D09C]' : 'text-[#FF5252]'}`}>
                {isPositive ? '+' : ''}
                {stock.priceChangePct.toFixed(2)}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Confidence: {(stock.quoteConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Market De-Noising & Relative Alpha Card */}
        {stock.isMarketNormalized && stock.relativeAlphaPct !== undefined && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-[#141822] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Market De-Noising & Alpha Engine
              </span>
              <span className={`font-extrabold text-sm px-2.5 py-0.5 rounded-full border ${
                stock.relativeAlphaPct >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {stock.relativeAlphaPct >= 0 ? '+' : ''}{stock.relativeAlphaPct.toFixed(2)}% Alpha
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-xl bg-[#0E121A] p-2.5 border border-[#232A3B]">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Stock Beta (β)</div>
                <div className="text-sm font-bold text-slate-200">{stock.beta?.toFixed(2) || '1.00'}</div>
              </div>

              <div className="rounded-xl bg-[#0E121A] p-2.5 border border-[#232A3B]">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">NIFTY 50 Move</div>
                <div className={`text-sm font-bold ${(stock.benchmarkChangePct || 0) >= 0 ? 'text-[#00D09C]' : 'text-[#FF5252]'}`}>
                  {(stock.benchmarkChangePct || 0) >= 0 ? '+' : ''}{(stock.benchmarkChangePct || 0).toFixed(2)}%
                </div>
              </div>

              <div className="rounded-xl bg-[#0E121A] p-2.5 border border-[#232A3B]">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Expected Move</div>
                <div className={`text-sm font-bold ${(stock.expectedMovePct || 0) >= 0 ? 'text-slate-200' : 'text-slate-300'}`}>
                  {(stock.expectedMovePct || 0) >= 0 ? '+' : ''}{(stock.expectedMovePct || 0).toFixed(2)}%
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic pt-0.5">
              *De-noises benchmark index macro fluctuations using CAPM Beta model to calculate idiosyncratic stock alpha.
            </p>
          </div>
        )}

        {/* Why This Stock Changed - Reason Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-[#00D09C]" /> Why This Change Matters
          </h3>

          <div className="space-y-2">
            {stock.reasons.map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-[#232A3B] bg-[#141822] p-3 text-xs text-slate-200"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#00D09C] mt-1.5 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Price Trend Chart */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            30-Day Historical Trend
          </h3>

          <div className="h-48 w-full rounded-2xl border border-[#232A3B] bg-[#141822] p-4">
            {loadingHistory ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading price history...
              </div>
            ) : history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No historical trend data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#00D09C' : '#FF5252'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isPositive ? '#00D09C' : '#FF5252'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} stroke="#475569" fontSize={10} />
                  <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0E121A', borderColor: '#232A3B', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: number) => [formatCurrency(val), 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? '#00D09C' : '#FF5252'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
