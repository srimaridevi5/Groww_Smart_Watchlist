import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'highAttention' | 'significant' | 'noteworthy' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-200 border-slate-700',
    success: 'bg-[#00D09C]/15 text-[#00D09C] border-[#00D09C]/30',
    danger: 'bg-[#FF5252]/15 text-[#FF5252] border-[#FF5252]/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    highAttention: 'bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-amber-500/30 text-pink-300 border-pink-500/40 shadow-sm animate-pulse-glow',
    significant: 'bg-[#00D09C]/20 text-[#00D09C] border-[#00D09C]/40 font-semibold',
    noteworthy: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    outline: 'bg-transparent text-slate-400 border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
