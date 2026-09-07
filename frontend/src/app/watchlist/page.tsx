'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlists } from '@/hooks/useWatchlists';
import { ChangeAnalysisResult, TimePointComparisonResult } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChangeSummaryBanner } from '@/components/watchlist/ChangeSummaryBanner';
import { WatchlistTable } from '@/components/watchlist/WatchlistTable';
import { AddStockModal } from '@/components/watchlist/AddStockModal';
import { StockDetailDrawer } from '@/components/watchlist/StockDetailDrawer';
import { TimeTravelBar, TimeTravelMode } from '@/components/watchlist/TimeTravelBar';
import { TimeComparisonTable } from '@/components/watchlist/TimeComparisonTable';
import {
  TrendingUp,
  Plus,
  LogOut,
  SlidersHorizontal,
  FolderPlus,
  Layers,
  Trash2,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function WatchlistPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<ChangeAnalysisResult | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false);

  // Time-Based Market Viewer & Comparison State
  const [timeTravelMode, setTimeTravelMode] = useState<TimeTravelMode>('LIVE');
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);
  const [timeA, setTimeA] = useState<string>(() => new Date().toISOString());
  const [timeB, setTimeB] = useState<string>(() => new Date().toISOString());

  const [historicalChanges, setHistoricalChanges] = useState<ChangeAnalysisResult[]>([]);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);

  const [comparisons, setComparisons] = useState<TimePointComparisonResult[]>([]);
  const [isLoadingComparisons, setIsLoadingComparisons] = useState(false);

  const {
    watchlists,
    isLoadingWatchlists,
    activeWatchlist,
    changes: liveChanges,
    isLoadingChanges,
    createWatchlist,
    deleteWatchlist,
    addStock,
    removeStock,
    recordSnapshot,
  } = useWatchlists(activeWatchlistId);

  // Auto-select initial default watchlist
  useEffect(() => {
    if (watchlists.length > 0 && (!activeWatchlistId || !watchlists.some((w) => w.id === activeWatchlistId))) {
      const defaultWl = watchlists.find((w) => w.isDefault) || watchlists[0];
      setActiveWatchlistId(defaultWl.id);
    }
  }, [watchlists, activeWatchlistId]);

  // Fetch historical changes when selectedTimestamp or activeWatchlistId changes in HISTORICAL mode
  useEffect(() => {
    if (timeTravelMode !== 'HISTORICAL' || !activeWatchlistId || !selectedTimestamp) return;

    setIsLoadingHistorical(true);
    apiClient
      .get(`/change-detection/watchlist/${activeWatchlistId}?asOfTimestamp=${encodeURIComponent(selectedTimestamp)}`)
      .then((res) => setHistoricalChanges(res.data))
      .catch(() => setHistoricalChanges([]))
      .finally(() => setIsLoadingHistorical(false));
  }, [timeTravelMode, activeWatchlistId, selectedTimestamp]);

  // Fetch comparison data when timeA or timeB changes in COMPARE mode
  const fetchComparisonData = (isoA: string, isoB: string) => {
    if (!activeWatchlistId) return;

    setIsLoadingComparisons(true);
    apiClient
      .get(`/change-detection/compare/${activeWatchlistId}?timeA=${encodeURIComponent(isoA)}&timeB=${encodeURIComponent(isoB)}`)
      .then((res) => setComparisons(res.data))
      .catch(() => setComparisons([]))
      .finally(() => setIsLoadingComparisons(false));
  };

  useEffect(() => {
    if (timeTravelMode === 'COMPARE' && activeWatchlistId) {
      fetchComparisonData(timeA, timeB);
    }
  }, [timeTravelMode, activeWatchlistId]);

  if (authLoading || isLoadingWatchlists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] text-slate-400 text-sm">
        Loading Groww Smart Watchlist...
      </div>
    );
  }

  // Active changes list (live vs historical)
  const activeChangesList = timeTravelMode === 'HISTORICAL' ? historicalChanges : liveChanges;

  // Filter change results based on active tab
  const filteredChanges = activeChangesList.filter((item) => {
    if (activeFilter === 'HIGH_ATTENTION') return item.severityTier === 'HIGH_ATTENTION';
    if (activeFilter === 'SIGNIFICANT') return item.severityTier === 'SIGNIFICANT';
    if (activeFilter === 'BREAKOUT') return item.technicalSignal !== 'NONE';
    return true;
  });

  const existingSymbols = activeWatchlist?.items.map((i) => i.stockSymbol) || [];

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    try {
      const created = await createWatchlist(newWatchlistName);
      setActiveWatchlistId(created.id);
      setNewWatchlistName('');
      setIsCreatingWatchlist(false);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#232A3B] bg-[#0B0E14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00D09C] text-black font-extrabold shadow-lg shadow-[#00D09C]/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Groww</span>
                <span className="rounded bg-[#00D09C]/20 px-2 py-0.5 text-[11px] font-bold text-[#00D09C]">
                  Smart Watchlist
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <div className="h-2 w-2 rounded-full bg-[#00D09C] animate-pulse" />
              <span>{user?.name || 'Investor'}</span>
            </div>

            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-400 hover:text-white">
              <LogOut className="mr-1.5 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Watchlist Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232A3B] pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {watchlists.map((wl) => {
              const isActive = wl.id === activeWatchlistId;
              return (
                <div
                  key={wl.id}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#141822] text-[#00D09C] border border-[#00D09C]/40 shadow-lg shadow-[#00D09C]/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141822]/60'
                  }`}
                >
                  <button
                    onClick={() => setActiveWatchlistId(wl.id)}
                    className="flex items-center gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    {wl.name}
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {wl.items.length}
                    </span>
                  </button>

                  {!wl.isDefault && watchlists.length > 1 && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete watchlist "${wl.name}"?`)) {
                          await deleteWatchlist(wl.id);
                          if (isActive) {
                            const fallbackWl = watchlists.find((w) => w.id !== wl.id);
                            if (fallbackWl) setActiveWatchlistId(fallbackWl.id);
                          }
                        }
                      }}
                      className="ml-1 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Watchlist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Create Watchlist button / form inline */}
            {isCreatingWatchlist ? (
              <form onSubmit={handleCreateWatchlist} className="flex items-center gap-2">
                <Input
                  placeholder="Watchlist Name"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  className="h-8 text-xs w-40"
                  autoFocus
                />
                <Button size="sm" type="submit" className="h-8 text-xs">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setIsCreatingWatchlist(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingWatchlist(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-[#00D09C] border border-dashed border-slate-700 hover:border-[#00D09C] transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                New List
              </button>
            )}
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddStockOpen(true)}
              disabled={!activeWatchlistId}
              className="bg-[#00D09C] text-black hover:bg-[#00B386] text-xs font-bold px-4 py-2"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Stock
            </Button>
          </div>
        </div>

        {/* Time-Based Market Data & Comparison Toolbar */}
        <TimeTravelBar
          watchlistId={activeWatchlistId}
          mode={timeTravelMode}
          onModeChange={setTimeTravelMode}
          selectedTimestamp={selectedTimestamp}
          onTimestampChange={setSelectedTimestamp}
          timeA={timeA}
          timeB={timeB}
          onTimeAChange={setTimeA}
          onTimeBChange={setTimeB}
          onCompareSubmit={fetchComparisonData}
        />

        {/* Active Mode Status Indicator Banners */}
        {timeTravelMode === 'HISTORICAL' && selectedTimestamp && (
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#141822] to-amber-950/20 p-3.5 text-xs text-amber-200 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <History className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Time Travel Viewer:</span> Showing market data captured as of{' '}
                <strong className="text-white">
                  {new Date(selectedTimestamp).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
              </div>
            </div>
            <button
              onClick={() => {
                setTimeTravelMode('LIVE');
                setSelectedTimestamp(null);
              }}
              className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="h-3 w-3" /> Switch to Live Market
            </button>
          </div>
        )}

        {timeTravelMode === 'COMPARE' && (
          <div className="rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-[#141822] to-purple-950/20 p-3.5 text-xs text-purple-200 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-bold">Timestamp Comparison Mode:</span> Comparing existing stock metrics between{' '}
                <strong className="text-white">
                  {new Date(timeA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>{' '}
                and{' '}
                <strong className="text-[#00D09C]">
                  {new Date(timeB).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>
            </div>
            <button
              onClick={() => setTimeTravelMode('LIVE')}
              className="rounded-lg bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300 hover:bg-purple-500/30 transition-colors flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="h-3 w-3" /> Exit Comparison
            </button>
          </div>
        )}

        {/* Change Summary Banner (Live & Historical Modes) */}
        {timeTravelMode !== 'COMPARE' && (
          <ChangeSummaryBanner
            changes={filteredChanges}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onRecordSnapshot={() => activeWatchlistId && recordSnapshot(activeWatchlistId)}
            isRecordingSnapshot={false}
          />
        )}

        {/* Watchlist Table or Comparison Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#00D09C]" />
              {timeTravelMode === 'COMPARE'
                ? `Timestamp Metric Comparisons (${comparisons.length} Securities)`
                : `Watchlist Securities (${filteredChanges.length})`}
            </h3>
            <span className="text-xs text-slate-400">
              Click any stock row for deep-dive rationale & historical trend chart
            </span>
          </div>

          {timeTravelMode === 'COMPARE' ? (
            <TimeComparisonTable
              comparisons={comparisons}
              isLoading={isLoadingComparisons}
              onSelectStock={(symbol) => {
                const stock = liveChanges.find((s) => s.symbol === symbol) || filteredChanges.find((s) => s.symbol === symbol);
                if (stock) setSelectedStock(stock);
              }}
            />
          ) : (
            <WatchlistTable
              items={filteredChanges}
              onSelectStock={setSelectedStock}
              onRemoveStock={(symbol) => activeWatchlistId && removeStock({ watchlistId: activeWatchlistId, symbol })}
            />
          )}
        </div>
      </main>

      {/* Add Stock Search Dialog */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        onAddStock={async (symbol) => {
          if (activeWatchlistId) {
            await addStock({ watchlistId: activeWatchlistId, symbol });
          }
        }}
        existingSymbols={existingSymbols}
      />

      {/* Stock Deep-Dive Rationale Drawer & Contextual Explanation Panel */}
      <StockDetailDrawer stock={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
}
