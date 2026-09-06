'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
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
      const res = await apiClient.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#141822] px-4 py-2 border border-[#232A3B] shadow-xl">
            <TrendingUp className="h-6 w-6 text-[#00D09C]" />
            <span className="text-xl font-extrabold tracking-tight text-white">
              Groww <span className="text-[#00D09C]">Smart Watchlist</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">Create your investor account</p>
        </div>

        <Card className="p-8 space-y-6 border-[#232A3B] bg-[#141822]/90 backdrop-blur-md">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-100">Create Account</h1>
            <p className="text-xs text-slate-400">Get personalized change insights across your watchlists</p>
          </div>

          {error && (
            <div className="rounded-xl border border-[#FF5252]/40 bg-[#FF5252]/10 p-3 text-xs text-[#FF5252] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Sridevi Investor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              Create Account
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#00D09C] hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
