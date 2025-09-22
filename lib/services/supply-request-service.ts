import type { 
  CreateSupplyRequestPayload, 
  SupplyRequestWithItems, 
  RequestItem,
  SupplyRequest,
  SupplyRequestItem,
  CreateSupplyRequestRPCArgs,
  CreateSupplyRequestRPCResult,
  GetSupplyRequestHistoryRPCArgs,
  GetSupplyRequestHistoryRPCResult,
  GetPendingApprovalsByRoleRPCArgs,
  Request,
  RequestWithDetails
} from '@/types/database'
import { BaseService } from './base-service'
import { realtimeManager } from './realtime-manager'
import { requestTypeService } from './request-type-service'
import { approvalService } from './approval-service'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

class SupplyRequestService extends BaseService {

  /**
   * Create a new supply request with items using RPC - Optimized atomic transaction
   * 🚀 Uses database RPC function for atomic operations
   */
  async createSupplyRequest(data: CreateSupplyRequestPayload): Promise<{ data: SupplyRequestWithItems | null; error: Error | null }> {
    try {
      const user = await this.getCurrentUser()
      const profile = await this.getCurrentUserProfile()

      // Transform items to database format
      const itemsPayload = data.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes || null
      }))

      // Call RPC function for atomic supply request creation
      const { data: result, error: rpcError } = await this.supabase
        .rpc('create_supply_request_with_items', {
          p_requester_id: user.id,
          p_role_id: profile.role_id,
          p_title: data.title,
          p_purpose: data.purpose,
          p_requested_date: data.requestedDate,
          p_priority: data.priority,
          p_items: JSON.stringify(itemsPayload)
        } as CreateSupplyRequestRPCArgs)

      if (rpcError) {
        console.error('RPC function error:', rpcError)
        return { data: null, error: rpcError }
      }

      const typedResult = result as CreateSupplyRequestRPCResult
      if (!typedResult || !typedResult.success) {
        return { data: null, error: new Error(typedResult?.message || 'Failed to create supply request') }
      }

      // Map database result to service interface
      const requestData = typedResult.request_data!
      const mappedResult: SupplyRequestWithItems = {
        ...requestData,
        items: (requestData.items || []).map((item: any) => ({
          ...item,
          name: item.item_name, // Map database field to service interface
          notes: item.description || undefined // Map database field to service interface and handle null
        }))
      }

      return {
        data: mappedResult,
        error: null
      }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  /**
   * Get pending approval requests using RPC function with strict role-based filtering
   * 🚀 Uses optimized database RPC function for role-based approval visibility
   */
  async getPendingApprovalRequests(): Promise<SupplyRequestWithItems[]> {
    try {
      const user = await this.getCurrentUser()
      const profile = await this.getCurrentUserProfile()
      
      if (!profile.role_id) {
        console.warn('User has no role assigned, cannot get pending approvals')
        return []
      }

      // Call new RPC function with strict role-based filtering
      const { data: result, error: rpcError } = await this.supabase
        .rpc('get_pending_approvals_by_role', {
          p_user_id: user.id,
          p_role_id: profile.role_id,
          p_request_type_name: undefined, // Get all request types
          p_include_items: true
        } as GetPendingApprovalsByRoleRPCArgs)

      if (rpcError) {
        console.error('RPC function error:', rpcError)
        throw rpcError
      }

      // RPC function returns JSONB array, parse and map to proper types
      const requests = (result as unknown as any[]) || []
      
      // Map from RPC result to SupplyRequestWithItems format with strict typing
      return requests.map((request: any): SupplyRequestWithItems => ({
        // Core request fields
        id: request.id,
        request_number: request.request_number,
        title: request.title,
        request_type_id: request.request_type_id,
        requester_id: request.requester_id,
        workflow_id: request.workflow_id,
        current_step_id: request.current_step_id,
        status: request.status as SupplyRequest['status'],
        priority: request.priority as SupplyRequest['priority'],
        payload: request.payload,
        requested_date: request.requested_date,
        due_date: request.due_date,
        completed_at: request.completed_at,
        created_at: request.created_at,
        updated_at: request.updated_at,
        // Note: Related data like request_type, requester, current_step are embedded in RPC response
        // but not part of SupplyRequestWithItems interface
        // Map items with proper field mapping
        items: (request.items || []).map((item: any): SupplyRequestItem => ({
          id: item.id,
          request_id: item.request_id,
          name: item.item_name, // Map database field to service interface
          quantity: item.quantity,
          unit: item.unit,
          notes: item.description, // Map database field to service interface
          created_at: item.created_at,
          updated_at: item.updated_at
        }))
      }))
      
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.getPendingApprovalRequests')
      return []
    }
  }

  /**
   * Get supply request history using RPC - Optimized with advanced filtering
   * 🚀 Uses database RPC function for complex filtering and pagination
   */
  async getSupplyRequestHistory(options: {
    page?: number
    pageSize?: number
    status?: 'all' | 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled'
    priority?: 'all' | 'low' | 'medium' | 'high' | 'urgent'
    searchQuery?: string
    dateFrom?: string
    dateTo?: string
    sortBy?: 'created_at' | 'updated_at' | 'status' | 'priority'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<{
    data: SupplyRequestWithItems[]
    totalCount: number
    totalPages: number
    currentPage: number
  }> {
    try {
      const user = await this.getCurrentUser()

      // Prepare filters object for RPC function
      const filters = {
        page: options.page || 1,
        page_size: options.pageSize || 20,
        status: options.status === 'all' ? null : options.status,
        priority: options.priority === 'all' ? null : options.priority,
        search_query: options.searchQuery?.trim() || null,
        date_from: options.dateFrom || null,
        date_to: options.dateTo || null,
        sort_by: options.sortBy || 'created_at',
        sort_order: options.sortOrder || 'desc'
      }

      // Call RPC function for optimized history query
      const { data: result, error: rpcError } = await this.supabase
        .rpc('get_supply_request_history', {
          p_user_id: user.id,
          p_filters: JSON.stringify(filters)
        } as GetSupplyRequestHistoryRPCArgs)

      if (rpcError) {
        console.error('RPC function error:', rpcError)
        throw rpcError
      }

      const typedResult = result as GetSupplyRequestHistoryRPCResult
      if (!typedResult || !typedResult.success) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: filters.page
        }
      }

      // Map database results to service interface
      const mappedData: SupplyRequestWithItems[] = (typedResult.data || []).map((request: any) => ({
        ...request,
        items: (request.items || []).map((item: RequestItem) => ({
          ...item,
          name: item.item_name, // Map database field to service interface
          notes: item.description // Map database field to service interface
        }))
      }))

      return {
        data: mappedData,
        totalCount: typedResult.total_count || 0,
        totalPages: typedResult.total_pages || 0,
        currentPage: typedResult.current_page || filters.page
      }
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.getSupplyRequestHistory')
      return {
        data: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: options.page || 1
      }
    }
  }

  /**
   * Get supply requests for the current user - Uses optimized RPC history function
   */
  async getUserSupplyRequests(): Promise<SupplyRequestWithItems[]> {
    try {
      // Use the history RPC function with default parameters to get all user requests
      const result = await this.getSupplyRequestHistory({
        page: 1,
        pageSize: 1000, // Large page size to get all requests
        status: 'all',
        priority: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      
      return result.data
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.getUserSupplyRequests')
      return []
    }
  }

  /**
   * Get a single supply request by ID - Simple query for individual requests
   */
  async getSupplyRequestById(id: string): Promise<SupplyRequestWithItems | null> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .select(`
          *,
          request_items(*),
          request_types!inner(name, display_name),
          profiles!inner(full_name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return data ? {
        ...data,
        items: data.request_items?.map((item: RequestItem) => ({
          ...item,
          name: item.item_name, // Map database field to service interface
          notes: item.description // Map database field to service interface
        })) || []
      } : null
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.getSupplyRequestById')
      return null
    }
  }

  /**
   * Update supply request status
   */
  async updateSupplyRequestStatus(
    id: string, 
    status: SupplyRequest['status']
  ): Promise<SupplyRequest | null> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .update({ 
          status,
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.updateSupplyRequestStatus')
      return null
    }
  }

  /**
   * Delete supply request (soft delete by setting status to cancelled)
   */
  async deleteSupplyRequest(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('requests')
        .update({ 
          status: 'cancelled',
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.deleteSupplyRequest')
      return false
    }
  }

  /**
   * Approve or reject a supply request - Uses existing approval service
   */
  async processApproval(
    requestId: string, 
    action: 'approve' | 'reject', 
    comments?: string
  ): Promise<{ success: boolean; newStatus: string; message: string }> {
    try {
      const result = await approvalService.processApproval(requestId, { action, comments })
      
      // Map database function response to service interface for backward compatibility
      return {
        success: result.success,
        newStatus: result.newStatus, 
        message: result.message
      }
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.processApproval')
      return { success: false, newStatus: '', message: 'Error processing approval' }
    }
  }

  /**
   * Update a single request item (used for inline editing in approval UI)
   */
  async updateRequestItem(
    requestId: string,
    itemId: string,
    updates: Partial<Pick<SupplyRequestItem, 'name' | 'quantity' | 'unit' | 'notes'>>
  ): Promise<SupplyRequestItem | null> {
    try {
      // Map service fields to DB fields
      const dbUpdates: Partial<Pick<RequestItem, 'item_name' | 'quantity' | 'unit' | 'description' | 'updated_at'>> = {
        updated_at: this.getCurrentTimestamp(),
      }

      if (typeof updates.name !== 'undefined') {
        dbUpdates.item_name = updates.name
      }
      if (typeof updates.quantity !== 'undefined') {
        dbUpdates.quantity = updates.quantity
      }
      if (typeof updates.unit !== 'undefined') {
        dbUpdates.unit = updates.unit
      }
      if (typeof updates.notes !== 'undefined') {
        dbUpdates.description = updates.notes ?? null
      }

      const { data, error } = await this.supabase
        .from('request_items')
        .update(dbUpdates)
        .eq('id', itemId)
        .eq('request_id', requestId)
        .select('*')
        .single()

      if (error) throw error

      // Map DB fields back to service type
      const mapped: SupplyRequestItem = {
        ...data,
        name: (data as unknown as RequestItem).item_name as unknown as string,
        notes: (data as unknown as RequestItem).description as unknown as string | undefined,
      }

      return mapped
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.updateRequestItem')
      return null
    }
  }

  /**
   * Get request types for dropdown
   */
  async getRequestTypes() {
    try {
      return await requestTypeService.getActiveRequestTypes()
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.getRequestTypes')
      return []
    }
  }

  /**
   * Subscribe to real-time updates for supply requests - Optimized with RealtimeManager
   */
  subscribeToSupplyRequests(
    options: {
      userId: string
      includeItems?: boolean
      includeApprovals?: boolean
      onlyOwnRequests?: boolean
      enablePerformanceOptimizations?: boolean
      debounceMs?: number
    },
    callbacks: {
      onRequestUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
      onItemUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
      onError?: (error: Error) => void
    }
  ): RealtimeChannel {
    return realtimeManager.subscribeToSupplyRequests(
      {
        userId: options.userId,
        includeItems: options.includeItems ?? true,
        includeApprovals: options.includeApprovals ?? false,
        onlyOwnRequests: options.onlyOwnRequests ?? false,
        enablePerformanceOptimizations: options.enablePerformanceOptimizations ?? true,
        debounceMs: options.debounceMs ?? 100
      },
      {
        onRequestUpdate: callbacks.onRequestUpdate,
        onItemUpdate: callbacks.onItemUpdate,
        onError: callbacks.onError
      }
    )
  }

  /**
   * Subscribe to approval updates for supply requests - Optimized with RealtimeManager
   */
  subscribeToApprovalUpdates(
    userId: string,
    callbacks: {
      onApprovalUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
      onError?: (error: Error) => void
    }
  ): RealtimeChannel {
    return realtimeManager.subscribeToApprovalUpdates(
      userId,
      {
        onApprovalUpdate: callbacks.onApprovalUpdate,
        onError: callbacks.onError
      }
    )
  }

  /**
   * Unsubscribe from supply request updates - Optimized with RealtimeManager
   */
  unsubscribeFromSupplyRequests(userId: string): void {
    realtimeManager.unsubscribeFromSupplyRequests(userId)
  }

  /**
   * Unsubscribe from approval updates - Optimized with RealtimeManager
   */
  unsubscribeFromApprovalUpdates(userId: string): void {
    realtimeManager.unsubscribeFromApprovalUpdates(userId)
  }

  /**
   * Get real-time connection health status
   */
  getRealtimeHealthStatus() {
    return realtimeManager.getHealthStatus()
  }
}

export const supplyRequestService = new SupplyRequestService()
