'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SupplyRequestWithItems } from '@/types/database'
import { supplyRequestService } from '@/lib/services/supply-request-service'
import { approvalService } from '@/lib/services/approval-service'
import { supplyRequestKeys } from './use-supply-requests'
import { toast } from 'sonner'
import { useAuth } from './use-auth'

/**
 * Enhanced hook for supply request detail with comprehensive functionality
 * Features:
 * - Type-safe request fetching with caching
 * - Real-time updates integration
 * - Optimistic updates for item editing
 * - Loading and error states
 * - Integration with approval workflow
 */
export function useSupplyRequestDetail(requestId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Main query for request details
  const detailQuery = useQuery({
    queryKey: supplyRequestKeys.detail(requestId),
    queryFn: async () => {
      if (!requestId) throw new Error('Request ID is required')
      const result = await supplyRequestService.getSupplyRequestById(requestId)
      return result
    },
    enabled: !!requestId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  // Query for approval permission check
  const approvalPermissionQuery = useQuery({
    queryKey: ['approval-permission', requestId, user?.id],
    queryFn: async () => {
      if (!requestId || !user?.id) return false
      return await approvalService.canUserApproveRequest(requestId, user.id)
    },
    enabled: !!requestId && !!user?.id && detailQuery.data?.status === 'pending',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Mutation for updating request items (inline editing)
  const updateItemMutation = useMutation({
    mutationFn: async ({ 
      itemId, 
      updates 
    }: {
      itemId: string
      updates: Partial<{ name: string; quantity: number; unit: string; notes?: string }>
    }) => {
      const result = await supplyRequestService.updateRequestItem(requestId, itemId, updates)
      if (!result) throw new Error('Failed to update request item')
      return result
    },

    onMutate: async ({ itemId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: supplyRequestKeys.detail(requestId) })

      // Snapshot previous value
      const previousRequest = queryClient.getQueryData<SupplyRequestWithItems>(
        supplyRequestKeys.detail(requestId)
      )

      // Optimistically update
      if (previousRequest) {
        queryClient.setQueryData<SupplyRequestWithItems>(
          supplyRequestKeys.detail(requestId),
          {
            ...previousRequest,
            items: (previousRequest.items || []).map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
            updated_at: new Date().toISOString()
          }
        )
      }

      return { previousRequest }
    },

    onSuccess: (result) => {
      toast.success('Đã cập nhật vật tư', {
        description: `${result.name} • SL: ${result.quantity} ${result.unit}`,
        duration: 4000,
      })
    },

    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousRequest) {
        queryClient.setQueryData(
          supplyRequestKeys.detail(requestId),
          context.previousRequest
        )
      }

      toast.error('Không thể cập nhật vật tư', {
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        duration: 6000,
      })
    },

    onSettled: () => {
      // Refresh data
      queryClient.invalidateQueries({ queryKey: supplyRequestKeys.detail(requestId) })
    }
  })

  // Mutation for processing approval
  const processApprovalMutation = useMutation({
    mutationFn: async ({ 
      action, 
      comments 
    }: {
      action: 'approve' | 'reject'
      comments?: string
    }) => {
      const result = await supplyRequestService.processApproval(requestId, action, comments)
      if (!result) throw new Error('Failed to process approval')
      return result
    },

    onMutate: async ({ action }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: supplyRequestKeys.detail(requestId) })

      // Snapshot previous value
      const previousRequest = queryClient.getQueryData<SupplyRequestWithItems>(
        supplyRequestKeys.detail(requestId)
      )

      // Optimistically update status
      if (previousRequest) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        const updateTimestamp = new Date().toISOString()
        
        queryClient.setQueryData<SupplyRequestWithItems>(
          supplyRequestKeys.detail(requestId),
          { 
            ...previousRequest, 
            status: newStatus, 
            updated_at: updateTimestamp,
            completed_at: updateTimestamp
          }
        )
      }

      return { previousRequest }
    },

    onSuccess: (result, { action }) => {
      const actionLabels = {
        approve: 'Đã phê duyệt',
        reject: 'Đã từ chối'
      }

      toast.success(`${actionLabels[action]} yêu cầu thành công!`, {
        description: result.message || 'Yêu cầu đã được xử lý',
        duration: 5000,
      })

      // Invalidate related queries
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: supplyRequestKeys.pendingApprovals(user.id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: supplyRequestKeys.list(user.id) 
        })
      }
    },

    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousRequest) {
        queryClient.setQueryData(
          supplyRequestKeys.detail(requestId),
          context.previousRequest
        )
      }

      toast.error('Không thể xử lý phê duyệt', {
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        duration: 7000,
      })
    },

    onSettled: () => {
      // Refresh data
      queryClient.invalidateQueries({ queryKey: supplyRequestKeys.detail(requestId) })
    }
  })

  const computedCanApprove = (
    detailQuery.data?.status === 'pending' && 
    user?.id !== detailQuery.data?.requester_id &&
    approvalPermissionQuery.data === true
  )

  return {
    // Data
    request: detailQuery.data,
    
    // Loading states
    isLoading: detailQuery.isLoading || approvalPermissionQuery.isLoading,
    isFetching: detailQuery.isFetching,
    isRefetching: detailQuery.isRefetching,
    isUpdatingItem: updateItemMutation.isPending,
    isProcessingApproval: processApprovalMutation.isPending,
    
    // Error states
    error: detailQuery.error || approvalPermissionQuery.error,
    
    // Actions
    refetch: detailQuery.refetch,
    updateItem: updateItemMutation.mutate,
    processApproval: processApprovalMutation.mutate,
    
    // Helper computed properties
    canEdit: detailQuery.data?.status === 'pending' && user?.id === detailQuery.data?.requester_id,
    canApprove: computedCanApprove,
    isOwnRequest: user?.id === detailQuery.data?.requester_id,
    
    // Query key for external cache management
    queryKey: supplyRequestKeys.detail(requestId)
  }
}

/**
 * Hook for supply request statistics and metadata
 */
export function useSupplyRequestStats(request?: SupplyRequestWithItems | null) {
  if (!request) return null

  const totalItems = request.items?.length || 0
  const totalQuantity = request.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
  
  const statusInfo = {
    isPending: request.status === 'pending',
    isInProgress: request.status === 'in_progress', 
    isApproved: request.status === 'approved',
    isRejected: request.status === 'rejected',
    isCancelled: request.status === 'cancelled',
    isCompleted: request.status === 'approved' && !!request.completed_at
  }

  const priorityInfo = {
    isLow: request.priority === 'low',
    isMedium: request.priority === 'medium',
    isHigh: request.priority === 'high',
    isUrgent: request.priority === 'urgent'
  }

  return {
    totalItems,
    totalQuantity,
    status: statusInfo,
    priority: priorityInfo,
    hasItems: totalItems > 0,
    createdDate: request.created_at ? new Date(request.created_at) : null,
    updatedDate: request.updated_at ? new Date(request.updated_at) : null,
    requestedDate: request.requested_date ? new Date(request.requested_date) : null,
  }
}
