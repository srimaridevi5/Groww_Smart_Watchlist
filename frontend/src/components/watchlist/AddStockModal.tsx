'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Plus, X, AlertCircle } from 'lucide-react';

interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (symbol: string) => Promise<void>;
  existingSymbols: string[];
}

export function AddStockModal({ isOpen, onClose, onAddStock, existingSymbols }: AddStockModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setErrorMsg(null);
      return;
    }

    const handler = setTimeout(() => {
      setLoading(true);
      apiClient
        .get(`/watchlists/search/stocks?q=${encodeURIComponent(query)}`)
        .then((res) => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (symbol: string) => {
    setErrorMsg(null);
    setAddingSymbol(symbol);
    try {
      await onAddStock(symbol);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || `Failed to add ${symbol}`;
      setErrorMsg(msg);
    } finally {
      setAddingSymbol(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#232A3B] bg-[#141822] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#00D09C]" /> Add Stock to Watchlist
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-[#FF5252]/40 bg-[#FF5252]/10 p-3.5 text-xs text-[#FF5252] flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search stock symbol (e.g., NVDA, RELIANCE, TCS)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching market directory...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching stocks found. Try typing <span className="text-slate-300 font-mono">NVDA</span>, <span className="text-slate-300 font-mono">TCS</span>, or <span className="text-slate-300 font-mono">RELIANCE</span>.
            </div>
          ) : (
            results.map((stock) => {
              const isAlreadyAdded = existingSymbols.includes(stock.symbol);

              return (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between rounded-xl border border-[#232A3B] bg-[#0E121A] p-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      {stock.symbol}
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {stock.exchange}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{stock.name}</div>
                  </div>

                  <Button
                    size="sm"
                    variant={isAlreadyAdded ? 'ghost' : 'primary'}
                    disabled={isAlreadyAdded || addingSymbol === stock.symbol}
                    isLoading={addingSymbol === stock.symbol}
                    onClick={() => handleAdd(stock.symbol)}
                  >
                    {isAlreadyAdded ? 'Added' : 'Add +'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
