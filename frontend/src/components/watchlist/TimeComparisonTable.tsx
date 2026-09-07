'use client';

import React from 'react';
import { TimePointComparisonResult } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface TimeComparisonTableProps {
  comparisons: TimePointComparisonResult[];
  onSelectStock: (symbol: string) => void;
  isLoading?: boolean;
}

export function TimeComparisonTable({ comparisons, onSelectStock, isLoading }: TimeComparisonTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#232A3B] bg-[#0E121A] p-12 text-center text-slate-400 text-sm">
        Computing comparison deltas between selected timestamps...
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="rounded-2xl border border-[#232A3B] bg-[#0E121A] p-12 text-center text-slate-400 text-sm">
        No watchlist securities available for comparison.
      </div>
    );
  }

  const timeLabelA = comparisons[0]?.timeA || 'Point A';
  const timeLabelB = comparisons[0]?.timeB || 'Point B';

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#232A3B] bg-[#0E121A] shadow-xl">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#232A3B] bg-[#141822]/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="py-3.5 px-4">Company & Symbol</th>
            <th className="py-3.5 px-4 text-right">Price @ {timeLabelA}</th>
            <th className="py-3.5 px-4 text-right">Price @ {timeLabelB}</th>
            <th className="py-3.5 px-4 text-right">Price Change Delta</th>
            <th className="py-3.5 px-4 text-center">Score Shift</th>
            <th className="py-3.5 px-4 text-center">Alpha Delta</th>
            <th className="py-3.5 px-4">Key Signals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232A3B]/60 text-slate-200">
          {comparisons.map((item) => {
            const isPositive = item.priceDelta >= 0;

            return (
              <tr
                key={item.symbol}
                onClick={() => onSelectStock(item.symbol)}
                className="cursor-pointer transition-colors hover:bg-[#141822] group"
              >
                {/* Symbol & Name */}
                <td className="py-4 px-4 font-semibold text-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#141822] font-bold text-[#00D09C] border border-[#232A3B] group-hover:border-[#00D09C]/40 transition-colors">
                      {item.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        {item.symbol}
                      </div>
                      <div className="text-[11px] font-normal text-slate-400">{item.name}</div>
                    </div>
                  </div>
                </td>

                {/* Price @ Time A */}
                <td className="py-4 px-4 text-right font-medium text-slate-300">
                  {formatCurrency(item.priceA, undefined, item.symbol)}
                </td>

                {/* Price @ Time B */}
                <td className="py-4 px-4 text-right font-bold text-slate-100">
                  {formatCurrency(item.priceB, undefined, item.symbol)}
                </td>

                {/* Price Change Delta */}
                <td className="py-4 px-4 text-right">
                  <div className="flex flex-col items-end">
                    <span
                      className={`font-extrabold text-xs flex items-center gap-1 ${
                        isPositive ? 'text-[#00D09C]' : 'text-[#FF5252]'
                      }`}
                    >
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? '+' : ''}
                      {formatCurrency(item.priceDelta, undefined, item.symbol)}
                    </span>
                    <span className={`text-[10.5px] font-bold ${isPositive ? 'text-[#00D09C]' : 'text-[#FF5252]'}`}>
                      ({isPositive ? '+' : ''}
                      {item.priceDeltaPct.toFixed(2)}%)
                    </span>
                  </div>
                </td>

                {/* Smart Score Shift */}
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-1 font-bold text-purple-300">
                    <span className="text-slate-400">{item.scoreA.toFixed(2)}</span>
                    <ArrowRight className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-purple-300">{item.scoreB.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold pt-0.5">
                    {item.scoreDelta >= 0 ? '+' : ''}
                    {item.scoreDelta.toFixed(2)} Score Delta
                  </div>
                </td>

                {/* Relative Alpha Shift */}
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                      (item.alphaDelta || 0) >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {(item.alphaDelta || 0) >= 0 ? '+' : ''}
                    {(item.alphaDelta || 0).toFixed(2)}% Alpha
                  </span>
                </td>

                {/* Reasons / Key Signals */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    {item.reasons.slice(0, 2).map((r, idx) => (
                      <div key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-[#00D09C] shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
