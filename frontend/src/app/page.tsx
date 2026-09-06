'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('groww_auth_token');
    if (token) {
      router.push('/watchlist');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0B0E14] text-slate-400 text-sm">
      Loading Groww Smart Watchlist...
    </div>
  );
}
