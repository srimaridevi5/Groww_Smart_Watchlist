import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, symbol?: string, stockSymbol?: string): string {
  if (value === undefined || value === null) return '₹0.00';

  const isUS = stockSymbol && ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(stockSymbol.toUpperCase());
  const currSymbol = symbol || (isUS ? '$' : '₹');
  const locale = isUS ? 'en-US' : 'en-IN';

  return `${currSymbol}${value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
  return value.toLocaleString('en-IN');
}
