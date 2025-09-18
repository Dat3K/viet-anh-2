import type { 
  CreateSupplyRequestPayload, 
  SupplyRequestWithItems, 
  RequestInsert,
  RequestItem,
  SupplyRequest
} from '@/types/database'
import { BaseService } from './base-service'
import { realtimeManager } from './realtime-manager'
import { requestTypeService } from './request-type-service'
import { workflowService } from './workflow-service'
import { approvalService } from './approval-service'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'


class SupplyRequestService extends BaseService {

  /**
   * Create a new supply request with items - Optimized with better error handling
   */
  async createSupplyRequest(data: CreateSupplyRequestPayload): Promise<{ data: SupplyRequestWithItems | null; error: Error | null }> {
    try {
      // Get supply request type ID
      const requestType = await requestTypeService.getRequestTypeByName('supply_request')
      if (!requestType) {
        return { data: null, error: new Error('Supply request type not found') }
      }

      // Get current user and profile
      const user = await this.getCurrentUser()
      const profile = await this.getCurrentUserProfile()

      // Get workflow assignment for this request type and user role
      const workflowAssignment = await workflowService.assignWorkflowToRequest(requestType.id, profile.role_id)

      // Create the main request with workflow initialization
      const insertData: Omit<RequestInsert, 'request_number'> = {
        title: data.title,
        request_type_id: requestType.id,
        requester_id: user.id,
        status: workflowAssignment.status,
        priority: data.priority,
        payload: {
          purpose: data.purpose,
          requestedDate: data.requestedDate
        },
        requested_date: data.requestedDate,
        workflow_id: workflowAssignment.workflowId,
        current_step_id: workflowAssignment.currentStepId
      }

      // Execute request creation with proper error handling
      const { data: request, error: requestError } = await this.supabase
        .from('requests')
        .insert(insertData)
        .select(`
          *,
          request_types!inner(name, display_name)
        `)
        .single()

      if (requestError) {
        return { data: null, error: requestError }
      }

      if (!request) {
        return { data: null, error: new Error('Failed to create request items') }
      }

      // Create request items using correct database table and field names
      const itemsToInsert = data.items.map(item => ({
        request_id: request.id,
        item_name: item.name, // Database field is item_name
        quantity: item.quantity,
        unit: item.unit,
        description: item.notes || null // Database field is description
      }))

      const { data: items, error: itemsError } = await this.supabase
        .from('request_items') // Correct table name
        .insert(itemsToInsert)
        .select('*')

      if (itemsError) {
        return { data: null, error: itemsError }
      }

      return {
        data: {
          ...request,
          items: items || []
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  /**
   * Get supply requests for the current user
   */
  async getUserSupplyRequests(): Promise<SupplyRequestWithItems[]> {
    try {
      const user = await this.getCurrentUser()

      const { data, error } = await this.supabase
        .from('requests')
        .select(`
          *,
          request_items!inner(*),
          request_types!inner(name, display_name)
        `)
        .eq('requester_id', user.id)
        .eq('request_types.name', 'supply_request')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(request => ({
        ...request,
        items: request.request_items?.map((item: RequestItem) => ({
          ...item,
          name: item.item_name, // Map database field to service interface
          notes: item.description // Map database field to service interface
        })) || []
      })) || []
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.getUserSupplyRequests')
    }
  }

  /**
   * Get a single supply request by ID
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
    }
  }

  /**
   * Update supply request status
   */
  async updateSupplyRequestStatus(
    id: string, 
    status: SupplyRequest['status']
  ): Promise<SupplyRequest> {
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
    }
  }

  /**
   * Delete supply request (soft delete by setting status to cancelled)
   */
  async deleteSupplyRequest(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('requests')
        .update({ 
          status: 'cancelled',
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.deleteSupplyRequest')
    }
  }

  /**
   * Subscribe to real-time updates for supply requests - Optimized with RealtimeManager
   */
  subscribeToSupplyRequests(
    userId: string,
    callbacks: {
      onRequestUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
      onItemUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
      onError?: (error: Error) => void
    }
  ): RealtimeChannel {
    return realtimeManager.subscribeToSupplyRequests(
      {
        userId,
        includeItems: true,
        includeApprovals: false,
        onlyOwnRequests: true
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

  /**
   * Get supply requests pending approval for current user
   */
  async getPendingApprovalRequests(): Promise<SupplyRequestWithItems[]> {
    try {
      const pendingRequests = await approvalService.getPendingApprovalRequests()
      
      // Filter for supply requests only and get full request details
      const supplyRequests = pendingRequests.filter(
        request => request.request_type.name === 'supply_request'
      )

      // Get full request details with items for each supply request
      const requestsWithItems = await Promise.all(
        supplyRequests.map(async (request) => {
          const fullRequest = await this.getSupplyRequestById(request.id)
          return fullRequest
        })
      )

      return requestsWithItems.filter(request => request !== null) as SupplyRequestWithItems[]
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.getPendingApprovalRequests')
    }
  }

  /**
   * Approve or reject a supply request
   */
  async processApproval(
    requestId: string, 
    action: 'approve' | 'reject', 
    comments?: string
  ): Promise<{ success: boolean; newStatus: string; message: string }> {
    try {
      return await approvalService.processApproval(requestId, { action, comments })
    } catch (error) {
      this.handleError(error, 'SupplyRequestService.processApproval')
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
    }
  }
}

export const supplyRequestService = new SupplyRequestService()
