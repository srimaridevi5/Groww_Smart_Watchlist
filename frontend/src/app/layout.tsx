'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import '@/app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Groww Smart Market Watchlist</title>
        <meta name="description" content="Groww Smart Market Watchlist - Surface meaningful stock movements since your last visit" />
      </head>
      <body className="bg-[#0B0E14] text-slate-100 min-h-screen">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
