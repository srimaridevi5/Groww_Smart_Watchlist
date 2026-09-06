import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-xs font-medium text-slate-300">{label}</label>}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-[#2B3548] bg-[#141822] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00D09C] focus:border-transparent transition-all',
            error && 'border-[#FF5252] focus:ring-[#FF5252]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-[#FF5252] font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
