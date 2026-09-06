'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Watchlist, ChangeAnalysisResult } from '@/types';

export function useWatchlists(activeWatchlistId?: string) {
  const queryClient = useQueryClient();

  // 1. Fetch user watchlists list
  const watchlistsQuery = useQuery<Watchlist[]>({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const res = await apiClient.get('/watchlists');
      return res.data;
    },
  });

  // 2. Fetch active watchlist details with quotes
  const activeWatchlistQuery = useQuery<Watchlist>({
    queryKey: ['watchlist', activeWatchlistId],
    queryFn: async () => {
      if (!activeWatchlistId) return null as any;
      const res = await apiClient.get(`/watchlists/${activeWatchlistId}`);
      return res.data;
    },
    enabled: !!activeWatchlistId,
    refetchInterval: 15000, // Poll market quotes every 15 seconds to respect API rate limits
  });

  // 3. Fetch smart change detection results since last visit
  const changeDetectionQuery = useQuery<ChangeAnalysisResult[]>({
    queryKey: ['change-detection', activeWatchlistId],
    queryFn: async () => {
      if (!activeWatchlistId) return [];
      const res = await apiClient.get(`/change-detection/watchlist/${activeWatchlistId}`);
      return res.data;
    },
    enabled: !!activeWatchlistId,
  });

  // 4. Create Watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiClient.post('/watchlists', { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });

  // 5. Add Stock mutation
  const addStockMutation = useMutation({
    mutationFn: async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
      const res = await apiClient.post(`/watchlists/${watchlistId}/stocks`, { symbol });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.watchlistId] });
      queryClient.invalidateQueries({ queryKey: ['change-detection', variables.watchlistId] });
    },
  });

  // 6. Remove Stock mutation
  const removeStockMutation = useMutation({
    mutationFn: async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
      const res = await apiClient.delete(`/watchlists/${watchlistId}/stocks/${symbol}`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.watchlistId] });
      queryClient.invalidateQueries({ queryKey: ['change-detection', variables.watchlistId] });
    },
  });

  // 7. Record Visit Snapshot mutation
  const recordSnapshotMutation = useMutation({
    mutationFn: async (watchlistId: string) => {
      const res = await apiClient.post(`/change-detection/snapshot/${watchlistId}`);
      return res.data;
    },
    onSuccess: (_, watchlistId) => {
      queryClient.invalidateQueries({ queryKey: ['change-detection', watchlistId] });
    },
  });

  return {
    watchlists: watchlistsQuery.data || [],
    isLoadingWatchlists: watchlistsQuery.isLoading,
    activeWatchlist: activeWatchlistQuery.data,
    isLoadingActive: activeWatchlistQuery.isLoading,
    changes: changeDetectionQuery.data || [],
    isLoadingChanges: changeDetectionQuery.isLoading,
    createWatchlist: createWatchlistMutation.mutateAsync,
    addStock: addStockMutation.mutateAsync,
    removeStock: removeStockMutation.mutateAsync,
    recordSnapshot: recordSnapshotMutation.mutateAsync,
  };
}
