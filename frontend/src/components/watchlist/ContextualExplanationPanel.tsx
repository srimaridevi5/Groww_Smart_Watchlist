'use client';

import React, { useEffect, useRef } from 'react';
import { MetricExplanation } from '@/lib/explanations';
import {
  X,
  Sparkles,
  Info,
  HelpCircle,
  Zap,
  TrendingUp,
  ShieldCheck,
  Award,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextualExplanationPanelProps {
  explanation: MetricExplanation | null;
  targetRect?: DOMRect | null;
  onClose: () => void;
}

export function ContextualExplanationPanel({
  explanation,
  targetRect,
  onClose,
}: ContextualExplanationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!explanation) return null;

  // Calculate dynamic top position relative to target rect
  let topPx: number = 80;
  if (targetRect && typeof window !== 'undefined') {
    const centerY = targetRect.top + targetRect.height / 2;
    // Align center of panel with center of metric, but clamp within screen height
    const estimatedHeight = 440;
    const clampedTop = Math.max(70, Math.min(window.innerHeight - estimatedHeight - 20, centerY - estimatedHeight / 3));
    topPx = clampedTop;
  }

  const categoryIconMap = {
    SCORE: <Zap className="h-4 w-4 text-purple-400" />,
    PRICE: <Activity className="h-4 w-4 text-[#00D09C]" />,
    ALPHA: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
    INSIGHT: <Award className="h-4 w-4 text-amber-400" />,
    CHART: <TrendingUp className="h-4 w-4 text-cyan-400" />,
    METADATA: <Info className="h-4 w-4 text-blue-400" />,
  };

  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'danger':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.94, x: -16 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.94, x: -16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ top: `${topPx}px` }}
        className="fixed left-4 sm:left-8 lg:left-12 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-w-md rounded-2xl border border-purple-500/30 bg-[#0E121A]/95 p-5 text-slate-100 shadow-[0_16px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all"
      >
        {/* Pointer Arrow pointing toward right details panel */}
        <div className="hidden lg:block absolute -right-3 top-8 h-0 w-0 border-y-[10px] border-y-transparent border-l-[12px] border-l-[#0E121A] filter drop-shadow-[2px_0_4px_rgba(168,85,247,0.3)]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#232A3B]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#141822] border border-[#232A3B] shadow-inner">
              {categoryIconMap[explanation.category] || <HelpCircle className="h-4 w-4 text-[#00D09C]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-100 tracking-tight">
                  {explanation.title}
                </h3>
                {explanation.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                      explanation.badge.variant
                    )}`}
                  >
                    {explanation.badge.text}
                  </span>
                )}
              </div>
              {explanation.subtitle && (
                <p className="text-xs text-slate-400 font-medium">{explanation.subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close explanation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-4 pt-3 text-xs">
          {/* Summary Box */}
          <div className="rounded-xl border border-slate-700/50 bg-[#141822]/90 p-3 text-slate-200 leading-relaxed shadow-sm flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-[#00D09C] shrink-0 mt-0.5" />
            <p className="font-medium text-[12px]">{explanation.summary}</p>
          </div>

          {/* Breakdown Items */}
          {explanation.details.length > 0 && (
            <div className="space-y-2.5">
              {explanation.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#232A3B] bg-[#141822]/50 p-2.5 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span className="uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 text-[#00D09C]" /> {detail.label}
                    </span>
                    <span className="text-[#00D09C]">{detail.value}</span>
                  </div>
                  <p className="text-slate-300 text-[11.5px] leading-snug pl-4">
                    {detail.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Math Formula / Model Logic if present */}
          {explanation.formula && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-2.5 text-[11px] font-mono text-purple-300">
              <span className="font-semibold text-purple-400 uppercase tracking-wider block text-[10px] mb-1 font-sans">
                Model Calculation
              </span>
              <code>{explanation.formula}</code>
            </div>
          )}

          {/* Bottom Line / Interpretation */}
          {explanation.interpretation && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-slate-200 leading-snug">
              <span className="font-bold text-[#00D09C] text-[11px] uppercase tracking-wider block mb-1">
                How to interpret this value
              </span>
              <p className="text-[11.5px] text-slate-300">{explanation.interpretation}</p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="mt-4 pt-2.5 border-t border-[#232A3B] flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3" /> Contextual explanation layer
          </span>
          <span>Click outside to close</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
