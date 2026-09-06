'use client';

import React from 'react';
import { ChangeAnalysisResult } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown, Trash2, ChevronRight, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

interface WatchlistTableProps {
  items: ChangeAnalysisResult[];
  onSelectStock: (stock: ChangeAnalysisResult) => void;
  onRemoveStock: (symbol: string) => void;
}

export function WatchlistTable({ items, onSelectStock, onRemoveStock }: WatchlistTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#232A3B] bg-[#141822] p-12 text-center text-slate-400">
        <p className="text-base font-medium text-slate-300">No stocks in this watchlist matching criteria.</p>
        <p className="text-xs text-slate-500 mt-1">Use the "Add Stock" button above to add tickers.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#232A3B] bg-[#141822] shadow-2xl">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#232A3B] bg-[#0E121A] text-xs font-semibold uppercase text-slate-400">
            <th className="py-3.5 px-4">Company / Symbol</th>
            <th className="py-3.5 px-4 text-right">Current Price</th>
            <th className="py-3.5 px-4 text-right">Since Last Visit</th>
            <th className="py-3.5 px-4 text-center">Relative Alpha (vs NIFTY)</th>
            <th className="py-3.5 px-4 text-center">Change Score (0-1)</th>
            <th className="py-3.5 px-4 text-center">52W Signal</th>
            <th className="py-3.5 px-4 text-right">Volume Ratio</th>
            <th className="py-3.5 px-4 text-center">Data Confidence</th>
            <th className="py-3.5 px-4 text-center">Trend</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#232A3B]/60 text-slate-200">
          {items.map((item) => {
            const isPositive = item.priceChangePct >= 0;

            // Confidence Badge Variant
            let confidenceVariant: 'success' | 'warning' | 'danger' | 'default' = 'success';
            let confidenceLabel = `${(item.quoteConfidence * 100).toFixed(0)}% Live`;
            if (item.quoteConfidence < 0.3) {
              confidenceVariant = 'danger';
              confidenceLabel = 'Mock Data';
            } else if (item.isDelayed || item.quoteConfidence < 0.8) {
              confidenceVariant = 'warning';
              confidenceLabel = '15m Delayed';
            }

            return (
              <tr
                key={item.symbol}
                onClick={() => onSelectStock(item)}
                className="group hover:bg-[#1C2333]/80 transition-colors cursor-pointer"
              >
                {/* Stock Symbol & Company */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 font-bold text-xs text-[#00D09C] border border-slate-700">
                      {item.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-[#00D09C] transition-colors flex items-center gap-1.5">
                        {item.symbol}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#00D09C]" />
                      </div>
                      <div className="text-xs text-slate-400 max-w-[160px] truncate">{item.name}</div>
                    </div>
                  </div>
                </td>

                {/* Price & 24h Change */}
                <td className="py-4 px-4 text-right">
                  <div className="font-bold text-slate-100">{formatCurrency(item.currentPrice, undefined, item.symbol)}</div>
                  <div className="text-xs text-slate-400 font-medium">
                    Baseline: {formatCurrency(item.baselinePrice, undefined, item.symbol)}
                  </div>
                </td>

                {/* Change Since Last Visit */}
                <td className="py-4 px-4 text-right">
                  <div
                    className={`inline-flex items-center font-bold text-sm ${
                      isPositive ? 'text-[#00D09C]' : 'text-[#FF5252]'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
                    {isPositive ? '+' : ''}
                    {item.priceChangePct.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-400">
                    ({isPositive ? '+' : ''}
                    {formatCurrency(item.priceChange, '')})
                  </div>
                </td>

                {/* Relative Alpha vs Benchmark */}
                <td className="py-4 px-4 text-center">
                  {item.relativeAlphaPct !== undefined ? (
                    <div className="flex flex-col items-center gap-0.5">
                      {item.relativeAlphaPct >= 0.5 ? (
                        <Badge variant="success" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold">
                          +{item.relativeAlphaPct.toFixed(1)}% Alpha
                        </Badge>
                      ) : item.relativeAlphaPct <= -0.5 ? (
                        <Badge variant="danger" className="bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold">
                          {item.relativeAlphaPct.toFixed(1)}% Alpha
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-700">
                          In Line (β {item.beta?.toFixed(2) || '1.0'})
                        </Badge>
                      )}
                      <span className="text-[10px] text-slate-500">β {item.beta?.toFixed(2) || '1.0'}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs">—</span>
                  )}
                </td>

                {/* Change Score (Normalized 0.00 - 1.00) */}
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    {item.severityTier === 'HIGH_ATTENTION' && (
                      <Badge variant="highAttention">{item.changeScore.toFixed(2)} High Attention</Badge>
                    )}
                    {item.severityTier === 'SIGNIFICANT' && (
                      <Badge variant="significant">{item.changeScore.toFixed(2)} Significant</Badge>
                    )}
                    {item.severityTier === 'NOTEWORTHY' && (
                      <Badge variant="noteworthy">{item.changeScore.toFixed(2)} Noteworthy</Badge>
                    )}
                    {item.severityTier === 'NORMAL' && (
                      <Badge variant="outline">{item.changeScore.toFixed(2)} Normal</Badge>
                    )}
                  </div>
                </td>

                {/* 52W Technical Signal */}
                <td className="py-4 px-4 text-center">
                  {item.technicalSignal === 'NEW_52W_HIGH' && (
                    <Badge variant="success">New 52W High</Badge>
                  )}
                  {item.technicalSignal === 'NEW_52W_LOW' && (
                    <Badge variant="danger">New 52W Low</Badge>
                  )}
                  {item.technicalSignal === 'NEAR_52W_HIGH' && (
                    <Badge variant="warning">Near 52W High</Badge>
                  )}
                  {item.technicalSignal === 'NEAR_52W_LOW' && (
                    <Badge variant="outline">Near 52W Low</Badge>
                  )}
                  {item.technicalSignal === 'NONE' && (
                    <span className="text-slate-500 text-xs">—</span>
                  )}
                </td>

                {/* Volume Ratio */}
                <td className="py-4 px-4 text-right font-medium">
                  <div className="text-slate-200 font-semibold">{item.volumeRatio.toFixed(1)}x</div>
                  <div className="text-xs text-slate-500">20d Avg</div>
                </td>

                {/* Data Confidence */}
                <td className="py-4 px-4 text-center">
                  <Badge variant={confidenceVariant} className="text-[11px]">
                    {item.isDelayed ? <Clock className="mr-1 h-3 w-3" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
                    {confidenceLabel}
                  </Badge>
                </td>

                {/* Sparkline trend */}
                <td className="py-4 px-4 text-center">
                  <Sparkline isPositive={isPositive} />
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onRemoveStock(item.symbol)}
                    className="p-2 text-slate-500 hover:text-[#FF5252] hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove stock from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
