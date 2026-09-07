'use client';

import React, { useState, useEffect } from 'react';
import { SnapshotSession } from '@/types';
import { apiClient } from '@/lib/api-client';
import {
  Clock,
  Zap,
  ArrowRightLeft,
  History,
  RotateCcw,
  Sparkles,
  Globe,
  Sliders,
} from 'lucide-react';

export type TimeTravelMode = 'LIVE' | 'HISTORICAL' | 'COMPARE';

interface TimeTravelBarProps {
  watchlistId?: string;
  mode: TimeTravelMode;
  onModeChange: (mode: TimeTravelMode) => void;
  selectedTimestamp: string | null;
  onTimestampChange: (ts: string | null) => void;
  timeA: string;
  timeB: string;
  onTimeAChange: (ts: string) => void;
  onTimeBChange: (ts: string) => void;
  onCompareSubmit: (timeA: string, timeB: string) => void;
}

export function TimeTravelBar({
  watchlistId,
  mode,
  onModeChange,
  selectedTimestamp,
  onTimestampChange,
  timeA,
  timeB,
  onTimeAChange,
  onTimeBChange,
  onCompareSubmit,
}: TimeTravelBarProps) {
  const [snapshots, setSnapshots] = useState<SnapshotSession[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('Local Time');

  // Custom Date & Time state for Single Timestamp Viewer
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState<string>('08:00');

  // Custom Date & Time state for Comparison Mode
  const [dateA, setDateA] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [hourA, setHourA] = useState<string>('08:00');

  const [dateB, setDateB] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [hourB, setHourB] = useState<string>('09:00');

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tz || 'Asia/Kolkata');
    } catch {
      setUserTimezone('Asia/Kolkata');
    }
  }, []);

  // Fetch saved snapshots for active watchlist
  useEffect(() => {
    if (!watchlistId) return;
    setLoadingSnapshots(true);
    apiClient
      .get(`/change-detection/snapshots/${watchlistId}`)
      .then((res) => setSnapshots(res.data))
      .catch(() => setSnapshots([]))
      .finally(() => setLoadingSnapshots(false));
  }, [watchlistId]);

  const applyCustomHistorical = (dStr: string, tStr: string) => {
    const combinedISO = new Date(`${dStr}T${tStr}:00`).toISOString();
    onTimestampChange(combinedISO);
  };

  const handleApplyPreset = (hour: string) => {
    setCustomTime(hour);
    applyCustomHistorical(customDate, hour);
  };

  const handleCompareTrigger = (dA: string, hA: string, dB: string, hB: string) => {
    const isoA = new Date(`${dA}T${hA}:00`).toISOString();
    const isoB = new Date(`${dB}T${hB}:00`).toISOString();
    onTimeAChange(isoA);
    onTimeBChange(isoB);
    onCompareSubmit(isoA, isoB);
  };

  return (
    <div className="rounded-2xl border border-[#232A3B] bg-[#0E121A] p-4 text-slate-100 shadow-xl space-y-4">
      {/* Control Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#232A3B] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Time-Based Market Data & Comparison
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Globe className="h-3 w-3 text-[#00D09C]" /> {userTimezone}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Select any date and time to view market data at that moment, or compare metrics between two timestamps.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center rounded-xl bg-[#141822] p-1 border border-[#232A3B]">
          <button
            onClick={() => {
              onModeChange('LIVE');
              onTimestampChange(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'LIVE'
                ? 'bg-[#00D09C] text-black shadow-md shadow-[#00D09C]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> Live Market
          </button>

          <button
            onClick={() => {
              onModeChange('HISTORICAL');
              applyCustomHistorical(customDate, customTime);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'HISTORICAL'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" /> Time Travel
          </button>

          <button
            onClick={() => {
              onModeChange('COMPARE');
              handleCompareTrigger(dateA, hourA, dateB, hourB);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'COMPARE'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Compare Times
          </button>
        </div>
      </div>

      {/* Mode Controls: Historical Time Travel */}
      {mode === 'HISTORICAL' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-3.5 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" /> Select Target Date & Time
            </span>

            <button
              onClick={() => {
                onModeChange('LIVE');
                onTimestampChange(null);
              }}
              className="text-[11px] text-slate-400 hover:text-amber-300 underline flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Return to Live Market
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Custom Date Picker */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Select Date</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  applyCustomHistorical(e.target.value, customTime);
                }}
                className="w-full rounded-xl border border-[#232A3B] bg-[#141822] px-3 py-1.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            {/* Custom Time Picker */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Select Time</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  applyCustomHistorical(customDate, e.target.value);
                }}
                className="w-full rounded-xl border border-[#232A3B] bg-[#141822] px-3 py-1.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            {/* Recorded Snapshots Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Recorded Session Snapshots</label>
              <select
                disabled={loadingSnapshots || snapshots.length === 0}
                onChange={(e) => {
                  if (e.target.value) {
                    onTimestampChange(e.target.value);
                    const dt = new Date(e.target.value);
                    setCustomDate(dt.toISOString().split('T')[0]);
                    setCustomTime(dt.toTimeString().substring(0, 5));
                  }
                }}
                className="w-full rounded-xl border border-[#232A3B] bg-[#141822] px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 outline-none cursor-pointer"
              >
                <option value="">
                  {loadingSnapshots
                    ? 'Loading saved sessions...'
                    : snapshots.length === 0
                    ? 'No saved snapshots (select custom time above)'
                    : 'Choose saved session...'}
                </option>
                {snapshots.map((snap) => (
                  <option key={snap.id} value={snap.capturedAt}>
                    Snapshot ({snap.formattedTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-semibold whitespace-nowrap">Quick Time Presets:</span>
            {['08:00', '09:00', '09:30', '12:00', '15:30'].map((presetHour) => (
              <button
                key={presetHour}
                onClick={() => handleApplyPreset(presetHour)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                  customTime === presetHour
                    ? 'bg-amber-400 text-black border-amber-400 font-bold'
                    : 'border-[#232A3B] bg-[#141822] text-slate-300 hover:border-amber-400'
                }`}
              >
                {presetHour} {parseInt(presetHour) >= 12 ? 'PM' : 'AM'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode Controls: Timestamp Comparison */}
      {mode === 'COMPARE' && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/10 p-3.5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-300 flex items-center gap-1.5">
              <ArrowRightLeft className="h-4 w-4 text-purple-400" /> Compare Existing Stock Metrics Between Two Selected Timestamps
            </span>

            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setDateA(today);
                setHourA('08:00');
                setDateB(today);
                setHourB('09:00');
                handleCompareTrigger(today, '08:00', today, '09:00');
              }}
              className="text-[11px] text-purple-300 hover:underline flex items-center gap-1"
            >
              <Sliders className="h-3 w-3" /> Quick Preset: 08:00 AM vs 09:00 AM
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Timestamp A */}
            <div className="rounded-xl border border-[#232A3B] bg-[#141822] p-3 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Time Point A (Baseline)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateA}
                  onChange={(e) => {
                    setDateA(e.target.value);
                    handleCompareTrigger(e.target.value, hourA, dateB, hourB);
                  }}
                  className="rounded-lg border border-[#232A3B] bg-[#0E121A] px-2.5 py-1 text-xs text-white outline-none focus:border-purple-400"
                />
                <input
                  type="time"
                  value={hourA}
                  onChange={(e) => {
                    setHourA(e.target.value);
                    handleCompareTrigger(dateA, e.target.value, dateB, hourB);
                  }}
                  className="rounded-lg border border-[#232A3B] bg-[#0E121A] px-2.5 py-1 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Timestamp B */}
            <div className="rounded-xl border border-[#232A3B] bg-[#141822] p-3 space-y-2">
              <span className="text-xs font-bold text-[#00D09C] uppercase tracking-wider block">
                Time Point B (Target)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateB}
                  onChange={(e) => {
                    setDateB(e.target.value);
                    handleCompareTrigger(dateA, hourA, e.target.value, hourB);
                  }}
                  className="rounded-lg border border-[#232A3B] bg-[#0E121A] px-2.5 py-1 text-xs text-white outline-none focus:border-purple-400"
                />
                <input
                  type="time"
                  value={hourB}
                  onChange={(e) => {
                    setHourB(e.target.value);
                    handleCompareTrigger(dateA, hourA, dateB, e.target.value);
                  }}
                  className="rounded-lg border border-[#232A3B] bg-[#0E121A] px-2.5 py-1 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
