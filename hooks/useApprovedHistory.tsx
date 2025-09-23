'use client'

import { useQuery } from '@tanstack/react-query'
import type { ApprovalHistoryEntry } from '@/types/database'
import { useAuth } from './use-auth'
import { approvalService } from '@/lib/services/approval-service'

// Query keys for approved history
export const approvedHistoryKeys = {
  all: ['approved-history'] as const,
  lists: () => [...approvedHistoryKeys.all, 'list'] as const,
  list: (userId: string) => [...approvedHistoryKeys.lists(), userId] as const,
}

/**
 * Hook to fetch user's approved request history with optimized caching
*/
export function useApprovedHistory() {
  const { user } = useAuth()

  return useQuery<ApprovalHistoryEntry[]>({
    queryKey: approvedHistoryKeys.list(user?.id || ''),
    queryFn: async () => {
      console.log('Fetching approved history for user:', user?.id)
      const startTime = performance.now()
      const result = await approvalService.getApprovedRequestsByApprover({ 
        page: 1, 
        pageSize: 1000 // Get all results for this user
      })
      const endTime = performance.now()
      console.log(`Fetched approved history in ${endTime - startTime}ms`)
      // Service returns data directly or undefined on error
      return result?.data || []
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error: Error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('not authenticated')) return false
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}