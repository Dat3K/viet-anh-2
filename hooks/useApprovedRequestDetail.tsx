'use client'

import { useQuery } from '@tanstack/react-query'
import type { RequestApprovalWithDetails } from '@/types/database'
import { useAuth } from './use-auth'
import { approvalService } from '@/lib/services/approval-service'

// Query keys for approved request detail
export const approvedRequestDetailKeys = {
  all: ['approved-request-detail'] as const,
  details: () => [...approvedRequestDetailKeys.all, 'detail'] as const,
 detail: (id: string) => [...approvedRequestDetailKeys.details(), id] as const,
}

/**
 * Hook to fetch approved request detail with optimized caching
 */
export function useApprovedRequestDetail(id: string) {
  const { user } = useAuth()

  return useQuery<RequestApprovalWithDetails | null>({
    queryKey: approvedRequestDetailKeys.detail(id),
    queryFn: async () => {
      if (!id) return null
      
      console.log('Fetching approved request detail:', id)
      const startTime = performance.now()
      
      // Get all approved requests and filter by ID
      const allApproved = await approvalService.getApprovedByUser(user?.id)
      const result = allApproved?.find(approval => approval.id === id) || null
      
      const endTime = performance.now()
      console.log(`Fetched approved request detail in ${endTime - startTime}ms`)
      
      return result
    },
    enabled: !!user?.id && !!id,
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