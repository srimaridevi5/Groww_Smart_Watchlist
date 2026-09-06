import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-[#232A3B] bg-[#141822] p-5 shadow-xl text-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  );
}
