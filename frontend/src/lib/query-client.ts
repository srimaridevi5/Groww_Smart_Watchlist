import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 5000, // 5 seconds stale time for financial quotes
      retry: 1,
    },
  },
});
