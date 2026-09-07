'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChangeAnalysisResult, HistoricalBar } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import {
  getExplanationForMetric,
  MetricExplanation,
  ChartPointContext,
} from '@/lib/explanations';
import { ContextualExplanationPanel } from './ContextualExplanationPanel';
import {
  X,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface StockDetailDrawerProps {
  stock: ChangeAnalysisResult | null;
  onClose: () => void;
}

export function StockDetailDrawer({ stock, onClose }: StockDetailDrawerProps) {
  const [history, setHistory] = useState<HistoricalBar[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Unified active explanation state
  const [activeExplanation, setActiveExplanation] = useState<{
    topicId: string;
    targetRect: DOMRect | null;
    extraContext?: { reasonText?: string; chartPoint?: ChartPointContext };
  } | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stock?.symbol) {
      setHistory([]);
      return;
    }

    // Reset active explanation when opening a new stock
    setActiveExplanation(null);

    let isSubscribed = true;
    setLoadingHistory(true);

    apiClient
      .get(`/market-data/history/${stock.symbol}`)
      .then((res) => {
        if (!isSubscribed) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setHistory(data);
      })
      .catch(() => {
        if (isSubscribed) setHistory([]);
      })
      .finally(() => {
        if (isSubscribed) setLoadingHistory(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [stock?.symbol]);


  if (!stock) return null;

  const isPositive = stock.priceChangePct >= 0;

  // Handler to set active metric explanation
  const handleMetricClick = (
    e: React.MouseEvent<HTMLElement>,
    topicId: string,
    extraContext?: { reasonText?: string; chartPoint?: ChartPointContext }
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isSameReason =
      extraContext?.reasonText &&
      activeExplanation?.extraContext?.reasonText === extraContext.reasonText;

    if (activeExplanation?.topicId === topicId && (!extraContext || isSameReason)) {
      setActiveExplanation(null);
    } else {
      setActiveExplanation({ topicId, targetRect: rect, extraContext });
    }
  };

  const handleMetricHover = (
    e: React.MouseEvent<HTMLElement>,
    topicId: string,
    extraContext?: { reasonText?: string; chartPoint?: ChartPointContext }
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveExplanation({ topicId, targetRect: rect, extraContext });
  };

  // Get explanation object for current active topic
  const currentExplanationData: MetricExplanation | null = activeExplanation
    ? getExplanationForMetric(activeExplanation.topicId, stock, activeExplanation.extraContext)
    : null;

  // Custom Chart Hover Tooltip Component
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HistoricalBar;
      const dateStr = new Date(data.timestamp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const isUp = data.close >= stock.baselinePrice;

      return (
        <div className="rounded-xl border border-[#232A3B] bg-[#0E121A]/95 p-3 text-xs shadow-2xl backdrop-blur-md space-y-1">
          <div className="text-[11px] font-semibold text-slate-400">{dateStr}</div>
          <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <span>Price:</span>
            <span className={isUp ? 'text-[#00D09C]' : 'text-[#FF5252]'}>
              {formatCurrency(data.close, undefined, stock.symbol)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 pt-0.5 border-t border-[#232A3B]/60">
            Click point to view historical breakdown
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setActiveExplanation(null)}
    >
      {/* Floating Contextual Explanation Panel on Left Side */}
      <ContextualExplanationPanel
        explanation={currentExplanationData}
        targetRect={activeExplanation?.targetRect}
        onClose={() => setActiveExplanation(null)}
      />

      {/* Main Right Stock Details Drawer */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#0E121A] border-l border-[#232A3B] h-full overflow-y-auto p-6 text-slate-100 shadow-2xl space-y-6 animate-in slide-in-from-right duration-300"
      >
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
                  <Badge
                    variant="success"
                    className="text-xs cursor-pointer hover:scale-105 transition-transform"
                    onClick={(e) => handleMetricClick(e, 'TECHNICAL_SIGNAL')}
                    onMouseEnter={(e) => handleMetricHover(e, 'TECHNICAL_SIGNAL')}
                  >
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
        <div
          onClick={(e) => handleMetricClick(e, 'CHANGE_SCORE')}
          onMouseEnter={(e) => handleMetricHover(e, 'CHANGE_SCORE')}
          className={`rounded-2xl border bg-gradient-to-br from-purple-950/30 to-[#141822] p-5 space-y-3 cursor-pointer transition-all ${
            activeExplanation?.topicId === 'CHANGE_SCORE'
              ? 'border-purple-400 ring-2 ring-purple-500/30 bg-purple-950/40 shadow-lg'
              : 'border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-950/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-purple-400" /> Smart Change Score
              <HelpCircle className="h-3.5 w-3.5 text-purple-400/70" />
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
            <span
              onClick={(e) => handleMetricClick(e, 'SEVERITY_LEVEL')}
              onMouseEnter={(e) => handleMetricHover(e, 'SEVERITY_LEVEL')}
              className="hover:text-purple-300 hover:underline cursor-pointer transition-colors"
            >
              Severity Level: <strong>{stock.severityTier}</strong>
            </span>
            <span
              onClick={(e) => handleMetricClick(e, 'DATA_PROVIDER')}
              onMouseEnter={(e) => handleMetricHover(e, 'DATA_PROVIDER')}
              className="hover:text-purple-300 hover:underline cursor-pointer transition-colors"
            >
              Data Provider: <strong>{stock.dataProvider}</strong>
            </span>
          </div>
        </div>

        {/* Price Baseline Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={(e) => handleMetricClick(e, 'BASELINE_PRICE')}
            onMouseEnter={(e) => handleMetricHover(e, 'BASELINE_PRICE')}
            className={`rounded-2xl border bg-[#141822] p-4 space-y-1 cursor-pointer transition-all ${
              activeExplanation?.topicId === 'BASELINE_PRICE'
                ? 'border-[#00D09C] ring-2 ring-[#00D09C]/20 bg-[#1A2234]'
                : 'border-[#232A3B] hover:border-[#00D09C]/50 hover:bg-[#1A2234]'
            }`}
          >
            <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" /> Baseline (Last Visit)
              </span>
              <HelpCircle className="h-3 w-3 text-slate-500" />
            </div>
            <div className="text-lg font-bold text-slate-200">
              {formatCurrency(stock.baselinePrice, undefined, stock.symbol)}
            </div>
            <div className="text-[11px] text-slate-500">
              Captured: {new Date(stock.lastVisitAt).toLocaleDateString()}
            </div>
          </div>

          <div
            onClick={(e) => handleMetricClick(e, 'CURRENT_PRICE')}
            onMouseEnter={(e) => handleMetricHover(e, 'CURRENT_PRICE')}
            className={`rounded-2xl border bg-[#141822] p-4 space-y-1 cursor-pointer transition-all ${
              activeExplanation?.topicId === 'CURRENT_PRICE' || activeExplanation?.topicId === 'PRICE_CHANGE_PCT'
                ? 'border-[#00D09C] ring-2 ring-[#00D09C]/20 bg-[#1A2234]'
                : 'border-[#232A3B] hover:border-[#00D09C]/50 hover:bg-[#1A2234]'
            }`}
          >
            <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-[#00D09C]" /> Current Market Price
              </span>
              <HelpCircle className="h-3 w-3 text-slate-500" />
            </div>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {formatCurrency(stock.currentPrice, undefined, stock.symbol)}
              <span
                onClick={(e) => handleMetricClick(e, 'PRICE_CHANGE_PCT')}
                onMouseEnter={(e) => handleMetricHover(e, 'PRICE_CHANGE_PCT')}
                className={`text-xs font-bold hover:underline cursor-pointer ${
                  isPositive ? 'text-[#00D09C]' : 'text-[#FF5252]'
                }`}
              >
                {isPositive ? '+' : ''}
                {stock.priceChangePct.toFixed(2)}%
              </span>
            </div>
            <div
              onClick={(e) => handleMetricClick(e, 'CONFIDENCE')}
              onMouseEnter={(e) => handleMetricHover(e, 'CONFIDENCE')}
              className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Confidence: {(stock.quoteConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Market De-Noising & Relative Alpha Card */}
        {stock.isMarketNormalized && stock.relativeAlphaPct !== undefined && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-[#141822] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span
                onClick={(e) => handleMetricClick(e, 'RELATIVE_ALPHA')}
                onMouseEnter={(e) => handleMetricHover(e, 'RELATIVE_ALPHA')}
                className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Market De-Noising & Alpha Engine
                <HelpCircle className="h-3 w-3 text-emerald-400/70" />
              </span>
              <span
                onClick={(e) => handleMetricClick(e, 'RELATIVE_ALPHA')}
                onMouseEnter={(e) => handleMetricHover(e, 'RELATIVE_ALPHA')}
                className={`font-extrabold text-sm px-2.5 py-0.5 rounded-full border cursor-pointer transition-transform hover:scale-105 ${
                  stock.relativeAlphaPct >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {stock.relativeAlphaPct >= 0 ? '+' : ''}
                {stock.relativeAlphaPct.toFixed(2)}% Alpha
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div
                onClick={(e) => handleMetricClick(e, 'STOCK_BETA')}
                onMouseEnter={(e) => handleMetricHover(e, 'STOCK_BETA')}
                className={`rounded-xl bg-[#0E121A] p-2.5 border transition-all cursor-pointer ${
                  activeExplanation?.topicId === 'STOCK_BETA'
                    ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-[#141B2A]'
                    : 'border-[#232A3B] hover:border-emerald-500/50 hover:bg-[#141B2A]'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                  Stock Beta (β) <HelpCircle className="h-2.5 w-2.5 text-slate-500" />
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {stock.beta?.toFixed(2) || '1.00'}
                </div>
              </div>

              <div
                onClick={(e) => handleMetricClick(e, 'BENCHMARK_MOVE')}
                onMouseEnter={(e) => handleMetricHover(e, 'BENCHMARK_MOVE')}
                className={`rounded-xl bg-[#0E121A] p-2.5 border transition-all cursor-pointer ${
                  activeExplanation?.topicId === 'BENCHMARK_MOVE'
                    ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-[#141B2A]'
                    : 'border-[#232A3B] hover:border-emerald-500/50 hover:bg-[#141B2A]'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                  NIFTY 50 Move <HelpCircle className="h-2.5 w-2.5 text-slate-500" />
                </div>
                <div
                  className={`text-sm font-bold ${
                    (stock.benchmarkChangePct || 0) >= 0 ? 'text-[#00D09C]' : 'text-[#FF5252]'
                  }`}
                >
                  {(stock.benchmarkChangePct || 0) >= 0 ? '+' : ''}
                  {(stock.benchmarkChangePct || 0).toFixed(2)}%
                </div>
              </div>

              <div
                onClick={(e) => handleMetricClick(e, 'EXPECTED_MOVE')}
                onMouseEnter={(e) => handleMetricHover(e, 'EXPECTED_MOVE')}
                className={`rounded-xl bg-[#0E121A] p-2.5 border transition-all cursor-pointer ${
                  activeExplanation?.topicId === 'EXPECTED_MOVE'
                    ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-[#141B2A]'
                    : 'border-[#232A3B] hover:border-emerald-500/50 hover:bg-[#141B2A]'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                  Expected Move <HelpCircle className="h-2.5 w-2.5 text-slate-500" />
                </div>
                <div
                  className={`text-sm font-bold ${
                    (stock.expectedMovePct || 0) >= 0 ? 'text-slate-200' : 'text-slate-300'
                  }`}
                >
                  {(stock.expectedMovePct || 0) >= 0 ? '+' : ''}
                  {(stock.expectedMovePct || 0).toFixed(2)}%
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic pt-0.5">
              *De-noises benchmark index macro fluctuations using CAPM Beta model to calculate
              idiosyncratic stock alpha.
            </p>
          </div>
        )}

        {/* Why This Stock Changed - Reason Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-[#00D09C]" /> Why This Change Matters
          </h3>

          <div className="space-y-2">
            {stock.reasons.map((reason, idx) => {
              const isSelected =
                activeExplanation?.topicId === 'INSIGHT_ITEM' &&
                activeExplanation?.extraContext?.reasonText === reason;

              return (
                <div
                  key={idx}
                  onClick={(e) => handleMetricClick(e, 'INSIGHT_ITEM', { reasonText: reason })}
                  onMouseEnter={(e) => handleMetricHover(e, 'INSIGHT_ITEM', { reasonText: reason })}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs text-slate-200 cursor-pointer transition-all relative group ${
                    isSelected
                      ? 'border-[#00D09C] ring-2 ring-[#00D09C]/20 bg-[#1A2234]'
                      : 'border-[#232A3B] bg-[#141822] hover:border-[#00D09C]/60 hover:bg-[#1A2234]'
                  }`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-[#00D09C] mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                  <span className="flex-1 font-medium leading-snug">{reason}</span>
                  <HelpCircle className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#00D09C] transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Historical Price Trend Chart */}
        <div className="space-y-3 pt-2" id="historical-chart-container">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              30-Day Historical Trend
            </h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-[#00D09C]" /> Click any point to explain date
            </span>
          </div>

          <div className="h-48 w-full rounded-2xl border border-[#232A3B] bg-[#141822] p-4 relative group hover:border-cyan-500/40 transition-colors">
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
                <AreaChart
                  data={history}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload.length) {
                      const bar = data.activePayload[0].payload as HistoricalBar;
                      const dateStr = new Date(bar.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const chartPoint: ChartPointContext = {
                        dateStr,
                        timestamp: bar.timestamp,
                        price: bar.close,
                      };
                      const container = document.getElementById('historical-chart-container');
                      const rect = container ? container.getBoundingClientRect() : null;
                      setActiveExplanation({
                        topicId: 'HISTORICAL_POINT',
                        targetRect: rect,
                        extraContext: { chartPoint },
                      });
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isPositive ? '#00D09C' : '#FF5252'}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={isPositive ? '#00D09C' : '#FF5252'}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) =>
                      new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    }
                    stroke="#475569"
                    fontSize={10}
                  />
                  <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} hide />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? '#00D09C' : '#FF5252'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                    activeDot={{
                      r: 6,
                      fill: isPositive ? '#00D09C' : '#FF5252',
                      stroke: '#0E121A',
                      strokeWidth: 2,
                      className: 'cursor-pointer animate-pulse',
                    }}
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
