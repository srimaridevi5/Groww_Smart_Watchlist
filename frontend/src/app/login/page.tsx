'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@groww.in');
    setPassword('Password123!');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#00D09C]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#141822] px-4 py-2 border border-[#232A3B] shadow-xl">
            <TrendingUp className="h-6 w-6 text-[#00D09C]" />
            <span className="text-xl font-extrabold tracking-tight text-white">
              Groww <span className="text-[#00D09C]">Smart Watchlist</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Surface meaningful stock changes since your last visit
          </p>
        </div>

        <Card className="p-8 space-y-6 border-[#232A3B] bg-[#141822]/90 backdrop-blur-md">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-100">Welcome back</h1>
            <p className="text-xs text-slate-400">Log in to view your smart watchlist insights</p>
          </div>

          {error && (
            <div className="rounded-xl border border-[#FF5252]/40 bg-[#FF5252]/10 p-3 text-xs text-[#FF5252] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Fill button */}
          <div className="pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs text-[#00D09C] border-[#00D09C]/40 hover:bg-[#00D09C]/10"
              onClick={handleDemoFill}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Fill Demo Credentials (demo@groww.in)
            </Button>
          </div>

          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-[#00D09C] hover:underline">
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
