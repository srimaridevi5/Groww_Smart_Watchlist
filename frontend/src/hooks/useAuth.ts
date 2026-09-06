'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('groww_auth_token');
    const storedUser = localStorage.getItem('groww_user');

    if (!token) {
      setLoading(false);
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }

    apiClient
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('groww_user', JSON.stringify(res.data));
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('groww_auth_token', token);
    localStorage.setItem('groww_user', JSON.stringify(userData));
    setUser(userData);
    router.push('/watchlist');
  };

  const logout = () => {
    localStorage.removeItem('groww_auth_token');
    localStorage.removeItem('groww_user');
    setUser(null);
    router.push('/login');
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
