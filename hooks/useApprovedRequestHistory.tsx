'use client'

import { useQuery } from '@tanstack/react-query'
import type { RequestApproval } from '@/types/database'
import { useAuth } from './use-auth'
import { approvalService } from '@/lib/services/approval-service'
import { useMemo } from 'react'

// Define extended type for approved requests with related data
export interface RequestApprovalWithDetails extends RequestApproval {
  request?: {
    id: string
    title: string
    status: string
    priority: string
    created_at: string
    request_number: string
    request_types?: {
      name: string
      display_name: string
    }
  }
  step?: {
    step_name: string
    step_order: number
  }
  approver?: {
    full_name: string
    email: string
  }
}

// Optimized Query keys with hierarchical structure
export const approvedRequestKeys = {
  all: ['approved-requests'] as const,
  lists: () => [...approvedRequestKeys.all, 'list'] as const,
  list: (userId: string, filters?: string) => [...approvedRequestKeys.lists(), userId, filters].filter(Boolean),
  details: () => [...approvedRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...approvedRequestKeys.details(), id] as const,
}

/**
 * Hook to fetch approved request history with advanced filtering and pagination
 * Follows established patterns with proper type safety and caching
 */
export function useApprovedRequestHistory(options: {
  page?: number
  pageSize?: number
  status?: 'all' | 'approved' | 'rejected'
  priority?: 'all' | 'low' | 'medium' | 'high' | 'urgent'
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'created_at' | 'updated_at' | 'approved_at' | 'status' | 'priority'
  sortOrder?: 'asc' | 'desc'
} = {}) {
  const { user } = useAuth()
  
  const queryKey = useMemo(() => [
    ...approvedRequestKeys.lists(),
    'history',
    user?.id,
    options
  ], [user?.id, options])

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await approvalService.getApprovedRequestHistory(options)
      return result
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes - slightly less than regular requests for history freshness
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount to avoid unnecessary requests
    placeholderData: (previousData) => previousData, // Smooth pagination transitions
    retry: (failureCount, error: Error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('not authenticated')) return false
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}