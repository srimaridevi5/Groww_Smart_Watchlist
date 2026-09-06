'use client';

import React from 'react';
import { ChangeAnalysisResult } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Zap, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface ChangeSummaryBannerProps {
  changes: ChangeAnalysisResult[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onRecordSnapshot: () => void;
  isRecordingSnapshot: boolean;
}

export function ChangeSummaryBanner({
  changes,
  activeFilter,
  onFilterChange,
  onRecordSnapshot,
  isRecordingSnapshot,
}: ChangeSummaryBannerProps) {
  if (changes.length === 0) return null;

  const highAttentionCount = changes.filter((c) => c.severityTier === 'HIGH_ATTENTION').length;
  const significantCount = changes.filter((c) => c.severityTier === 'SIGNIFICANT').length;
  const breakoutCount = changes.filter((c) => c.technicalSignal === 'NEW_52W_HIGH' || c.technicalSignal === 'NEW_52W_LOW').length;

  const lastVisitDate = changes[0]?.lastVisitAt
    ? new Date(changes[0].lastVisitAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent Session';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#141822] to-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
      {/* Subtle Glow backdrop */}
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <Zap className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-100">Smart Change Insights</h2>
            <Badge variant="outline" className="text-slate-400 border-slate-700/80">
              <Clock className="mr-1 h-3 w-3" /> Since {lastVisitDate}
            </Badge>
          </div>

          <p className="text-sm text-slate-300">
            {highAttentionCount > 0 ? (
              <span>
                <strong className="text-pink-400">{highAttentionCount} stock(s)</strong> require high attention due to volume spikes or price velocity.
              </span>
            ) : significantCount > 0 ? (
              <span>
                <strong className="text-[#00D09C]">{significantCount} stock(s)</strong> moved significantly since your last visit.
              </span>
            ) : (
              <span>All watchlist stocks are trading within normal baseline parameters.</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRecordSnapshot}
            isLoading={isRecordingSnapshot}
            className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Update Visit Snapshot
          </Button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/80">
        <button
          onClick={() => onFilterChange('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeFilter === 'ALL'
              ? 'bg-[#00D09C] text-black font-semibold'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Stocks ({changes.length})
        </button>

        <button
          onClick={() => onFilterChange('HIGH_ATTENTION')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
            activeFilter === 'HIGH_ATTENTION'
              ? 'bg-pink-500 text-white font-semibold'
              : 'bg-slate-800/60 text-pink-400/80 hover:text-pink-300'
          }`}
        >
          <Zap className="h-3 w-3" />
          High Attention ({highAttentionCount})
        </button>

        <button
          onClick={() => onFilterChange('SIGNIFICANT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
            activeFilter === 'SIGNIFICANT'
              ? 'bg-[#00D09C] text-black font-semibold'
              : 'bg-slate-800/60 text-[#00D09C]/80 hover:text-[#00D09C]'
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          Significant ({significantCount})
        </button>

        <button
          onClick={() => onFilterChange('BREAKOUT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
            activeFilter === 'BREAKOUT'
              ? 'bg-amber-500 text-black font-semibold'
              : 'bg-slate-800/60 text-amber-400 hover:text-amber-300'
          }`}
        >
          <AlertCircle className="h-3 w-3" />
          52W Breakouts / Near ({breakoutCount})
        </button>
      </div>
    </div>
  );
}
