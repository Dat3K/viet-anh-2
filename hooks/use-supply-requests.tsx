'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import type { CreateSupplyRequestPayload, SupplyRequestWithItems } from '@/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { StatusType } from '@/components/ui/status-badge'
import type { PriorityType } from '@/components/ui/priority-badge'
import { useAuth } from './use-auth'
import { supplyRequestService } from '@/lib/services/supply-request-service'
import { toast } from 'sonner'
import { useEffect, useState, useCallback, useMemo } from 'react'

// Optimized Query keys with hierarchical structure
export const supplyRequestKeys = {
  all: ['supply-requests'] as const,
  lists: () => [...supplyRequestKeys.all, 'list'] as const,
  list: (userId: string, filters?: string) => [...supplyRequestKeys.lists(), userId, filters].filter(Boolean),
  details: () => [...supplyRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplyRequestKeys.details(), id] as const,
  types: () => [...supplyRequestKeys.all, 'types'] as const,
  approvals: () => [...supplyRequestKeys.all, 'approvals'] as const,
  pendingApprovals: (userId: string) => [...supplyRequestKeys.approvals(), 'pending', userId] as const,
}

/**
 * Hook to update a single supply request item with optimistic updates
 */
export function useUpdateSupplyRequestItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationKey: supplyRequestMutationKeys.updateItem,
    mutationFn: async ({ requestId, itemId, updates }: {
      requestId: string
      itemId: string
      updates: Partial<{ name: string; quantity: number; unit: string; notes?: string }>
    }) => {
      const result = await supplyRequestService.updateRequestItem(requestId, itemId, updates)
      if (!result) throw new Error('Failed to update request item')
      return result
    },

    onMutate: async ({ requestId, itemId, updates }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const pendingApprovalsKey = supplyRequestKeys.pendingApprovals(user.id)
      const detailQueryKey = supplyRequestKeys.detail(requestId)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: pendingApprovalsKey }),
        queryClient.cancelQueries({ queryKey: detailQueryKey })
      ])

      const prevPending = queryClient.getQueryData<SupplyRequestWithItems[]>(pendingApprovalsKey)
      const prevDetail = queryClient.getQueryData<SupplyRequestWithItems>(detailQueryKey)

      // Optimistically update in pending approvals list
      if (prevPending) {
        queryClient.setQueryData<SupplyRequestWithItems[]>(
          pendingApprovalsKey,
          prevPending.map(req => {
            if (req.id !== requestId) return req
            return {
              ...req,
              items: (req.items || []).map(item =>
                item.id === itemId
                  ? { ...item, ...updates }
                  : item
              )
            }
          })
        )
      }

      // Optimistically update detail view
      if (prevDetail) {
        queryClient.setQueryData<SupplyRequestWithItems>(
          detailQueryKey,
          {
            ...prevDetail,
            items: (prevDetail.items || []).map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        )
      }

      return { prevPending, prevDetail, pendingApprovalsKey, detailQueryKey }
    },

    onSuccess: (result) => {
      toast.success('Đã lưu thay đổi vật tư', {
        description: `${result.name} • SL: ${result.quantity} ${result.unit}`,
        duration: 4000,
      })
    },

    onError: (error, variables, context) => {
      if (context?.prevPending && context?.pendingApprovalsKey) {
        queryClient.setQueryData(context.pendingApprovalsKey, context.prevPending)
      }
      if (context?.prevDetail && context?.detailQueryKey) {
        queryClient.setQueryData(context.detailQueryKey, context.prevDetail)
      }

      toast.error('Không thể cập nhật vật tư', {
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        duration: 6000,
      })
    },

    onSettled: (data, error, variables, context) => {
      if (context?.pendingApprovalsKey) {
        queryClient.invalidateQueries({ queryKey: context.pendingApprovalsKey })
      }
      if (context?.detailQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.detailQueryKey })
      }
    },
  })
}

// Mutation keys for better organization
export const supplyRequestMutationKeys = {
  create: ['supply-requests', 'create'] as const,
  update: ['supply-requests', 'update'] as const,
  delete: ['supply-requests', 'delete'] as const,
  approve: ['supply-requests', 'approve'] as const,
  updateItem: ['supply-requests', 'update-item'] as const,
}

// Type definitions for filters
export type StatusFilter = StatusType | 'all'
export type PriorityFilter = PriorityType | 'all'

/**
 * Hook to fetch user's supply requests with optimized caching and error handling
 */
export function useSupplyRequests() {
  const { user } = useAuth()

  return useQuery({
    queryKey: supplyRequestKeys.list(user?.id || ''),
    queryFn: async () => {
      const result = await supplyRequestService.getUserSupplyRequests()
      // Service returns data directly or undefined on error
      return result || []
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (increased for better UX)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData, // Smooth transitions between data
    retry: (failureCount, error: Error) => {
      // Don't retry on auth errors or client errors
      if (error?.message?.includes('not authenticated')) return false
      return failureCount < 2 // Reduced retry attempts
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

/**
 * Hook to fetch a single supply request by ID with optimized caching
 */
export function useSupplyRequest(id: string) {
  return useQuery({
    queryKey: supplyRequestKeys.detail(id),
    queryFn: async () => {
      const result = await supplyRequestService.getSupplyRequestById(id)
      // Service returns data directly or null/undefined on error
      return result || null
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to create supply request with enhanced optimistic updates and error handling
 */
export function useCreateSupplyRequest() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationKey: supplyRequestMutationKeys.create,
    mutationFn: async (data: CreateSupplyRequestPayload) => {
      const result = await supplyRequestService.createSupplyRequest(data)
      
      // Handle service response format
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create supply request')
      }
      
      if (!result.data) {
        throw new Error('No data returned from create request')
      }
      
      return result.data
    },
    
    // Enhanced optimistic update
    onMutate: async (newRequestData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const userQueryKey = supplyRequestKeys.list(user.id)
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userQueryKey })

      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData<SupplyRequestWithItems[]>(userQueryKey)

      // Create optimistic request with proper typing
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const optimisticRequest: SupplyRequestWithItems = {
        id: tempId,
        request_number: `TEMP-${Date.now()}`,
        title: newRequestData.title,
        request_type_id: 'temp-supply-request-id',
        requester_id: user.id,
        workflow_id: null,
        current_step_id: null,
        status: 'pending',
        priority: newRequestData.priority,
        payload: {
          purpose: newRequestData.purpose,
          requestedDate: newRequestData.requestedDate
        },
        requested_date: newRequestData.requestedDate,
        due_date: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: newRequestData.items.map((item, index) => ({
          id: `temp-item-${tempId}-${index}`,
          request_id: tempId,
          item_name: item.name,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          description: item.notes || null,
          notes: item.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      }

      // Optimistically update the cache
      queryClient.setQueryData<SupplyRequestWithItems[]>(
        userQueryKey,
        (old = []) => [optimisticRequest, ...old]
      )

      return { previousRequests, optimisticRequest, userQueryKey }
    },

    // Enhanced success handling
    onSuccess: (result, variables, context) => {
      if (!context) return

      // Replace optimistic request with real data
      queryClient.setQueryData<SupplyRequestWithItems[]>(
        context.userQueryKey,
        (old = []) => old.map(request => 
          request.id === context.optimisticRequest.id ? result : request
        )
      )

      toast.success('Yêu cầu vật tư đã được tạo thành công!', {
        description: `Mã yêu cầu: ${result.request_number} • ${result.items?.length || 0} vật tư`,
        duration: 5000,
      })
    },

    // Enhanced error handling
    onError: (error, variables, context) => {
      // Revert to previous state
      if (context?.previousRequests && context?.userQueryKey) {
        queryClient.setQueryData(context.userQueryKey, context.previousRequests)
      }

      // Enhanced error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Có lỗi xảy ra khi tạo yêu cầu'
      
      toast.error('Không thể tạo yêu cầu vật tư', {
        description: errorMessage,
        duration: 7000,
        action: {
          label: 'Thử lại',
          onClick: () => {
            // Could implement retry logic here
          }
        }
      })

      // Log error for debugging
      console.error('Create supply request error:', error)
    },

    // Always refetch after completion
    onSettled: (data, error, variables, context) => {
      if (context?.userQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.userQueryKey })
      }
      // Also invalidate request types in case they changed
      queryClient.invalidateQueries({ queryKey: supplyRequestKeys.types() })
    },

    // Enhanced retry configuration
    retry: (failureCount, error: Error) => {
      // Don't retry on validation errors or auth errors
      if (error?.message?.includes('not authenticated') || 
          error?.message?.includes('validation')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
}

/**
 * Hook to update supply request status with enhanced optimistic updates
 */
export function useUpdateSupplyRequestStatus() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationKey: supplyRequestMutationKeys.update,
    mutationFn: async ({ id, status }: { 
      id: string; 
      status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' 
    }) => {
      const result = await supplyRequestService.updateSupplyRequestStatus(id, status)
      // Service returns data directly or throws error
      if (!result) throw new Error('Failed to update request status')
      return result
    },

    onMutate: async ({ id, status }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const userQueryKey = supplyRequestKeys.list(user.id)
      const detailQueryKey = supplyRequestKeys.detail(id)
      
      // Cancel outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({ queryKey: userQueryKey }),
        queryClient.cancelQueries({ queryKey: detailQueryKey })
      ])

      // Snapshot previous values
      const previousRequests = queryClient.getQueryData<SupplyRequestWithItems[]>(userQueryKey)
      const previousRequest = queryClient.getQueryData<SupplyRequestWithItems>(detailQueryKey)

      const updateTimestamp = new Date().toISOString()

      // Optimistically update list
      queryClient.setQueryData<SupplyRequestWithItems[]>(
        userQueryKey,
        (old = []) => old.map(request => 
          request.id === id 
            ? { ...request, status, updated_at: updateTimestamp }
            : request
        )
      )

      // Optimistically update detail
      if (previousRequest) {
        queryClient.setQueryData<SupplyRequestWithItems>(
          detailQueryKey,
          { ...previousRequest, status, updated_at: updateTimestamp }
        )
      }

      return { previousRequests, previousRequest, userQueryKey, detailQueryKey }
    },

    onSuccess: (result, { status }) => {
      const statusLabels = {
        pending: 'Chờ xử lý',
        in_progress: 'Đang xử lý',
        approved: 'Đã duyệt',
        rejected: 'Từ chối',
        cancelled: 'Đã hủy'
      }

      toast.success('Cập nhật trạng thái thành công!', {
        description: `Trạng thái: ${statusLabels[status]}`,
        duration: 4000,
      })
    },

    onError: (error, variables, context) => {
      // Revert optimistic updates
      if (context?.previousRequests && context?.userQueryKey) {
        queryClient.setQueryData(context.userQueryKey, context.previousRequests)
      }
      if (context?.previousRequest && context?.detailQueryKey) {
        queryClient.setQueryData(context.detailQueryKey, context.previousRequest)
      }

      toast.error('Không thể cập nhật trạng thái', {
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        duration: 6000,
      })
    },

    onSettled: (data, error, variables, context) => {
      // Invalidate related queries
      if (context?.userQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.userQueryKey })
      }
      if (context?.detailQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.detailQueryKey })
      }
    }
  })
}

/**
 * Hook to delete supply request with enhanced optimistic updates
 */
export function useDeleteSupplyRequest() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationKey: supplyRequestMutationKeys.delete,
    mutationFn: async (id: string) => {
      // Service method performs soft delete (sets status to cancelled)
      await supplyRequestService.deleteSupplyRequest(id)
      return id
    },

    onMutate: async (id) => {
      if (!user?.id) throw new Error('User not authenticated')

      const userQueryKey = supplyRequestKeys.list(user.id)
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userQueryKey })

      // Snapshot previous value
      const previousRequests = queryClient.getQueryData<SupplyRequestWithItems[]>(userQueryKey)
      const requestToDelete = previousRequests?.find(r => r.id === id)

      // Optimistically remove from list
      queryClient.setQueryData<SupplyRequestWithItems[]>(
        userQueryKey,
        (old = []) => old.filter(request => request.id !== id)
      )

      return { previousRequests, requestToDelete, userQueryKey }
    },

    onSuccess: (deletedId, variables, context) => {
      toast.success('Yêu cầu đã được hủy thành công!', {
        description: context?.requestToDelete?.title || 'Yêu cầu vật tư',
        duration: 4000,
      })
    },

    onError: (error, id, context) => {
      // Revert optimistic update
      if (context?.previousRequests && context?.userQueryKey) {
        queryClient.setQueryData(context.userQueryKey, context.previousRequests)
      }

      toast.error('Không thể hủy yêu cầu', {
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        duration: 6000,
      })
    },

    onSettled: (data, error, variables, context) => {
      if (context?.userQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.userQueryKey })
      }
    }
  })
}

/**
 * Hook to get request types with enhanced caching
 */
export function useRequestTypes() {
  return useQuery({
    queryKey: supplyRequestKeys.types(),
    queryFn: async () => {
      const result = await supplyRequestService.getRequestTypes()
      // Service returns data directly or undefined on error
      return result || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

/**
 * Hook to fetch pending approval requests with optimized caching
 */
export function usePendingApprovalRequests() {
  const { user } = useAuth()

  return useQuery({
    queryKey: supplyRequestKeys.pendingApprovals(user?.id || ''),
    queryFn: async () => {
      const result = await supplyRequestService.getPendingApprovalRequests()
      // Service returns data directly or undefined on error
      return result || []
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true, // Important for approval workflows
    retry: 2,
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to process approval with enhanced optimistic updates and error handling
 */
export function useProcessApproval() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationKey: supplyRequestMutationKeys.approve,
    mutationFn: async ({ requestId, action, comments }: {
      requestId: string
      action: 'approve' | 'reject'
      comments?: string
    }) => {
      const result = await supplyRequestService.processApproval(requestId, action, comments)
      // Service returns result directly or throws error
      if (!result) throw new Error('Failed to process approval')
      return result
    },

    onMutate: async ({ requestId, action }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const pendingApprovalsKey = supplyRequestKeys.pendingApprovals(user.id)
      const detailQueryKey = supplyRequestKeys.detail(requestId)
      
      // Cancel outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({ queryKey: pendingApprovalsKey }),
        queryClient.cancelQueries({ queryKey: detailQueryKey })
      ])

      // Snapshot previous values
      const previousPendingRequests = queryClient.getQueryData<SupplyRequestWithItems[]>(pendingApprovalsKey)
      const previousRequest = queryClient.getQueryData<SupplyRequestWithItems>(detailQueryKey)

      // Optimistically update pending requests (remove processed request)
      queryClient.setQueryData<SupplyRequestWithItems[]>(
        pendingApprovalsKey,
        (old = []) => old.filter(request => request.id !== requestId)
      )

      // Optimistically update request detail
      if (previousRequest) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        const updateTimestamp = new Date().toISOString()
        
        queryClient.setQueryData<SupplyRequestWithItems>(
          detailQueryKey,
          { 
            ...previousRequest, 
            status: newStatus, 
            updated_at: updateTimestamp,
            completed_at: updateTimestamp
          }
        )
      }

      return { 
        previousPendingRequests, 
        previousRequest, 
        pendingApprovalsKey, 
        detailQueryKey 
      }
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

      // Invalidate user's own requests if they might be affected
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: supplyRequestKeys.list(user.id) 
        })
      }
    },

    onError: (error, variables, context) => {
      // Revert optimistic updates
      if (context?.previousPendingRequests && context?.pendingApprovalsKey) {
        queryClient.setQueryData(context.pendingApprovalsKey, context.previousPendingRequests)
      }
      if (context?.previousRequest && context?.detailQueryKey) {
        queryClient.setQueryData(context.detailQueryKey, context.previousRequest)
      }

      toast.error('Không thể xử lý phê duyệt', {
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        duration: 7000,
      })
    },

    onSettled: (data, error, variables, context) => {
      // Invalidate related queries
      if (context?.pendingApprovalsKey) {
        queryClient.invalidateQueries({ queryKey: context.pendingApprovalsKey })
      }
      if (context?.detailQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.detailQueryKey })
      }
    }
  })
}

/**
 * Enhanced hook for real-time supply request updates with better integration - OPTIMIZED
 * Features:
 * - Smart cache invalidation with granular updates
 * - Performance optimizations with debouncing
 * - Connection health monitoring
 * - Auto-retry with exponential backoff
 * - Memory leak prevention
 */
export function useSupplyRequestRealtime(options: {
  /** Enable performance optimizations like debouncing */
  enableOptimizations?: boolean
  /** Custom debounce delay in milliseconds */
  debounceMs?: number
  /** Enable connection health monitoring */
  enableHealthMonitoring?: boolean
} = {}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [connectionHealth, setConnectionHealth] = useState<{
    isConnected: boolean
    isHealthy: boolean
    lastUpdate?: Date
    errorCount: number
  }>({
    isConnected: false,
    isHealthy: false,
    errorCount: 0
  })

  useEffect(() => {
    if (!user?.id) {
      setConnectionHealth({
        isConnected: false,
        isHealthy: false,
        errorCount: 0
      })
      return
    }

    // Subscribe to supply request updates using optimized service layer
    supplyRequestService.subscribeToSupplyRequests(
      {
        userId: user.id,
        includeItems: true,
        includeApprovals: false, // Separate subscription for approvals
        enablePerformanceOptimizations: options.enableOptimizations ?? true,
        debounceMs: options.debounceMs ?? 100,
      },
      {
        onRequestUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Smarter cache invalidation strategy
          const userQueryKey = supplyRequestKeys.list(user.id)
          
          // Update connection health
          setConnectionHealth(prev => ({
            ...prev,
            isConnected: true,
            isHealthy: true,
            lastUpdate: new Date()
          }))
          
          // Optimize invalidation based on payload event type
          if (payload.eventType === 'INSERT') {
            // For new requests, invalidate list and pending approvals
            queryClient.invalidateQueries({ queryKey: userQueryKey })
            queryClient.invalidateQueries({ 
              queryKey: supplyRequestKeys.pendingApprovals(user.id) 
            })
          } else if (payload.eventType === 'UPDATE') {
            // For updates, be more specific about what to invalidate
            if (payload.new && 'id' in payload.new && payload.new.id) {
              const requestId = payload.new.id as string
              
              // Update specific request detail
              queryClient.invalidateQueries({ 
                queryKey: supplyRequestKeys.detail(requestId) 
              })
              
              // Update list if status changed
              if (payload.old && payload.new.status !== payload.old.status) {
                queryClient.invalidateQueries({ queryKey: userQueryKey })
                queryClient.invalidateQueries({ 
                  queryKey: supplyRequestKeys.pendingApprovals(user.id) 
                })
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // For deletions, invalidate list
            queryClient.invalidateQueries({ queryKey: userQueryKey })
          }
        },
        onItemUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Handle item updates with optimized cache updates
          if (payload.new && 'request_id' in payload.new && payload.new.request_id) {
            const requestId = payload.new.request_id as string
            const payloadNew = payload.new as Record<string, unknown>
            
            // Use setQueryData for more targeted updates instead of full invalidation
            queryClient.setQueryData(
              supplyRequestKeys.detail(requestId),
              (oldData: SupplyRequestWithItems | undefined) => {
                if (!oldData) return oldData
                
                // Update specific item in the request with proper typing
                const updatedItems = oldData.items?.map(item => 
                  item.id === payloadNew.id ? { ...item, ...payloadNew } : item
                ) || []
                
                return {
                  ...oldData,
                  items: updatedItems,
                  updated_at: new Date().toISOString()
                } as SupplyRequestWithItems
              }
            )
          }
        },
        onError: (error: Error) => {
          console.error('🚨 Optimized real-time subscription error:', error)
          
          // Update connection health
          setConnectionHealth(prev => ({
            ...prev,
            isHealthy: false,
            errorCount: prev.errorCount + 1
          }))
          
          // Could show a toast notification about connection issues
          // toast.error('Kết nối realtime bị lỗi', { 
          //   description: 'Dữ liệu có thể không được cập nhật tự động' 
          // })
        }
      }
    )

    // Subscribe to approval updates using optimized service layer  
    supplyRequestService.subscribeToApprovalUpdates(
      user.id,
      {
        onApprovalUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Optimized approval cache updates
          queryClient.invalidateQueries({ 
            queryKey: supplyRequestKeys.pendingApprovals(user.id) 
          })
          
          // Update specific request detail if we know the request ID
          if (payload.new && 'request_id' in payload.new && payload.new.request_id) {
            queryClient.invalidateQueries({ 
              queryKey: supplyRequestKeys.detail(payload.new.request_id as string) 
            })
          }
        },
        onError: (error: Error) => {
          console.error('🚨 Optimized approval subscription error:', error)
          
          setConnectionHealth(prev => ({
            ...prev,
            errorCount: prev.errorCount + 1
          }))
        }
      }
    )

    // Set up connection health monitoring if enabled
    let healthCheckInterval: NodeJS.Timeout | undefined
    if (options.enableHealthMonitoring) {
      healthCheckInterval = setInterval(() => {
        const healthStatus = supplyRequestService.getRealtimeHealthStatus()
        
        setConnectionHealth(prev => ({
          ...prev,
          isConnected: healthStatus.isHealthy,
          isHealthy: healthStatus.isHealthy && prev.errorCount < 5,
        }))
      }, 10000) // Check every 10 seconds
    }

    // Initial connection status
    setConnectionHealth({
      isConnected: true,
      isHealthy: true,
      lastUpdate: new Date(),
      errorCount: 0
    })

    // Cleanup subscriptions on unmount
    return () => {
      supplyRequestService.unsubscribeFromSupplyRequests(user.id)
      supplyRequestService.unsubscribeFromApprovalUpdates(user.id)
      
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval)
      }
      
      setConnectionHealth({
        isConnected: false,
        isHealthy: false,
        errorCount: 0
      })
    }
  }, [user?.id, queryClient, options.enableOptimizations, options.debounceMs, options.enableHealthMonitoring])

  // Return enhanced subscription status with health monitoring
  return {
    isConnected: connectionHealth.isConnected,
    isHealthy: connectionHealth.isHealthy,
    lastUpdate: connectionHealth.lastUpdate,
    errorCount: connectionHealth.errorCount,
    // Helper method to manually trigger health check
    refreshHealth: () => {
      if (user?.id) {
        const healthStatus = supplyRequestService.getRealtimeHealthStatus()
        setConnectionHealth(prev => ({
          ...prev,
          isConnected: healthStatus.isHealthy,
          isHealthy: healthStatus.isHealthy,
          lastUpdate: new Date()
        }))
      }
    }
  }
}

/**
 * Hook to manage supply request filters with enhanced state management
 */
export function useSupplyRequestFilters() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as StatusFilter,
    priority: 'all' as PriorityFilter,
  })

  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters((prev: typeof filters) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all' as StatusFilter,
      priority: 'all' as PriorityFilter,
    })
  }, [])

  // Memoized filtered results helper
  const getFilteredRequests = useCallback((requests: SupplyRequestWithItems[] = []) => {
    return requests.filter(request => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          request.title.toLowerCase().includes(searchLower) ||
          request.request_number?.toLowerCase().includes(searchLower) ||
          request.items?.some(item => 
            item.name?.toLowerCase().includes(searchLower)
          )
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status !== 'all' && request.status !== filters.status) {
        return false
      }

      // Priority filter
      if (filters.priority !== 'all' && request.priority !== filters.priority) {
        return false
      }

      return true
    })
  }, [filters])

  return {
    filters,
    updateFilter,
    resetFilters,
    getFilteredRequests,
  }
}

/**
 * Hook to compute supply request statistics with enhanced metrics
 */
export function useSupplyRequestStats(requests?: SupplyRequestWithItems[]) {
  return useMemo(() => {
    if (!requests?.length) return {
      total: 0,
      pending: 0,
      inProgress: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      totalItems: 0,
      avgItemsPerRequest: 0,
    }

    const stats = requests.reduce((acc, request) => {
      acc.total++
      acc.totalItems += request.items?.length || 0
      
      switch (request.status) {
        case 'pending':
          acc.pending++
          break
        case 'in_progress':
          acc.inProgress++
          break
        case 'approved':
          acc.approved++
          break
        case 'rejected':
          acc.rejected++
          break
        case 'cancelled':
          acc.cancelled++
          break
      }
      
      return acc
    }, {
      total: 0,
      pending: 0,
      inProgress: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      totalItems: 0,
    })

    return {
      ...stats,
      avgItemsPerRequest: stats.total > 0 ? Math.round((stats.totalItems / stats.total) * 10) / 10 : 0,
    }
  }, [requests])
}
