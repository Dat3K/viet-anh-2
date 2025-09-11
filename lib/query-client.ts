import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403 errors
        if (error && (error as { status?: number })?.status === 401 || (error as { status?: number })?.status === 403) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403 errors
        if (error && (error as { status?: number })?.status === 401 || (error as { status?: number })?.status === 403) {
          return false
        }
        // Retry up to 2 times for mutations
        return failureCount < 2
      },
    },
  },
})