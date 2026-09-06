import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00D09C] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#00D09C] hover:bg-[#00B386] text-black font-semibold shadow-lg shadow-[#00D09C]/20',
    secondary: 'bg-[#1F2633] hover:bg-[#283244] text-slate-100 border border-[#2B3548]',
    danger: 'bg-[#FF5252]/15 hover:bg-[#FF5252]/25 text-[#FF5252] border border-[#FF5252]/30',
    ghost: 'hover:bg-slate-800/60 text-slate-300 hover:text-white',
    outline: 'border border-slate-700 hover:border-[#00D09C] text-slate-300 hover:text-[#00D09C] bg-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
