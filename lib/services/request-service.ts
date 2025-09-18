import { BaseService } from './base-service'
import type { 
  Request, 
  RequestInsert, 
  RequestUpdate,
  RequestWithDetails
} from '@/types/database'
import { workflowService } from './workflow-service'

/**
 * Generic request service for all request types
 * Implements Repository pattern
 */
export class RequestService extends BaseService {
  /**
   * Get all requests for current user
   */
  async getUserRequests(
    status?: string,
    requestType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<RequestWithDetails[]> {
    try {
      const user = await this.getCurrentUser()

      let query = this.supabase
        .from('requests')
        .select(`
          *,
          requester:profiles!requester_id(
            id,
            full_name,
            email,
            employee_code
          ),
          request_type:request_types!request_type_id(*),
          workflow:approval_workflows!workflow_id(*),
          current_step:approval_steps!current_step_id(*),
          items:request_items(*),
          approvals:request_approvals(
            *,
            approver:profiles!approver_id(full_name, email),
            step:approval_steps!step_id(step_name, step_order)
          )
        `)
        .eq('requester_id', user.id)

      if (status) {
        query = query.eq('status', status)
      }

      if (requestType) {
        query = query.eq('request_types.name', requestType)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestService.getUserRequests')
    }
  }

  /**
   * Get request by ID with full details
   */
  async getRequestById(id: string): Promise<RequestWithDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .select(`
          *,
          requester:profiles!requester_id(
            id,
            full_name,
            email,
            employee_code
          ),
          request_type:request_types!request_type_id(*),
          workflow:approval_workflows!workflow_id(*),
          current_step:approval_steps!current_step_id(*),
          items:request_items(*),
          approvals:request_approvals(
            *,
            approver:profiles!approver_id(full_name, email),
            step:approval_steps!step_id(step_name, step_order)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      this.handleError(error, 'RequestService.getRequestById')
    }
  }

  /**
   * Create new request
   */
  async createRequest(requestData: RequestInsert): Promise<Request> {
    try {
      const user = await this.getCurrentUser()

      const { data, error } = await this.supabase
        .from('requests')
        .insert({
          ...requestData,
          requester_id: user.id,
          created_at: this.getCurrentTimestamp(),
          updated_at: this.getCurrentTimestamp()
        })
        .select('*')
        .single()

      if (error) throw error

      return data
    } catch (error) {
      this.handleError(error, 'RequestService.createRequest')
    }
  }

  /**
   * Update request
   */
  async updateRequest(id: string, updates: RequestUpdate): Promise<Request> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .update({
          ...updates,
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error

      return data
    } catch (error) {
      this.handleError(error, 'RequestService.updateRequest')
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(
    id: string, 
    status: string,
    completedAt?: string
  ): Promise<Request> {
    try {
      const updates: RequestUpdate = {
        status,
        updated_at: this.getCurrentTimestamp()
      }

      if (completedAt) {
        updates.completed_at = completedAt
      } else if (status === 'approved' || status === 'rejected' || status === 'cancelled') {
        updates.completed_at = this.getCurrentTimestamp()
      }

      return await this.updateRequest(id, updates)
    } catch (error) {
      this.handleError(error, 'RequestService.updateRequestStatus')
    }
  }

  /**
   * Cancel request (soft delete)
   */
  async cancelRequest(id: string, reason?: string): Promise<Request> {
    try {
      const updates: RequestUpdate = {
        status: 'cancelled',
        completed_at: this.getCurrentTimestamp()
      }

      // Add cancellation reason to payload if provided
      if (reason) {
        const currentRequest = await this.getRequestById(id)
        const currentPayload = currentRequest?.payload || {}
        updates.payload = {
          ...(currentPayload as object),
          cancellation_reason: reason,
          cancelled_at: this.getCurrentTimestamp()
        }
      }

      return await this.updateRequest(id, updates)
    } catch (error) {
      this.handleError(error, 'RequestService.cancelRequest')
    }
  }

  /**
   * Get requests by status
   */
  async getRequestsByStatus(
    status: string,
    requestType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<RequestWithDetails[]> {
    try {
      let query = this.supabase
        .from('requests')
        .select(`
          *,
          requester:profiles!requester_id(
            id,
            full_name,
            email,
            employee_code
          ),
          request_type:request_types!request_type_id(*),
          workflow:approval_workflows!workflow_id(*),
          current_step:approval_steps!current_step_id(*)
        `)
        .eq('status', status)

      if (requestType) {
        query = query.eq('request_types.name', requestType)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestService.getRequestsByStatus')
    }
  }

  /**
   * Get requests by date range
   */
  async getRequestsByDateRange(
    startDate: string,
    endDate: string,
    requestType?: string,
    status?: string
  ): Promise<RequestWithDetails[]> {
    try {
      let query = this.supabase
        .from('requests')
        .select(`
          *,
          requester:profiles!requester_id(
            id,
            full_name,
            email,
            employee_code
          ),
          request_type:request_types!request_type_id(*),
          workflow:approval_workflows!workflow_id(*),
          current_step:approval_steps!current_step_id(*)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (requestType) {
        query = query.eq('request_types.name', requestType)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestService.getRequestsByDateRange')
    }
  }

  /**
   * Search requests
   */
  async searchRequests(
    searchTerm: string,
    requestType?: string,
    status?: string,
    limit: number = 50
  ): Promise<RequestWithDetails[]> {
    try {
      let query = this.supabase
        .from('requests')
        .select(`
          *,
          requester:profiles!requester_id(
            id,
            full_name,
            email,
            employee_code
          ),
          request_type:request_types!request_type_id(*),
          workflow:approval_workflows!workflow_id(*),
          current_step:approval_steps!current_step_id(*)
        `)
        .or(`title.ilike.%${searchTerm}%,request_number.ilike.%${searchTerm}%`)

      if (requestType) {
        query = query.eq('request_types.name', requestType)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestService.searchRequests')
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStats(
    startDate?: string,
    endDate?: string,
    requestType?: string
  ): Promise<{
    total: number
    byStatus: Array<{
      status: string
      count: number
    }>
    byType: Array<{
      type: string
      count: number
    }>
    byPriority: Array<{
      priority: string
      count: number
    }>
    avgProcessingTime: number
  }> {
    try {
      let query = this.supabase.from('requests').select('*')
      
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }
      if (requestType) {
        query = query.eq('request_types.name', requestType)
      }

      const [totalResult, detailsResult] = await Promise.all([
        this.supabase.from('requests').select('id', { count: 'exact', head: true }),
        query.select(`
          status,
          priority,
          created_at,
          completed_at,
          request_type:request_types!request_type_id(name, display_name)
        `)
      ])

      if (totalResult.error) throw totalResult.error
      if (detailsResult.error) throw detailsResult.error

      const total = totalResult.count || 0

      // Count by status, type, and priority
      const statusCounts = new Map<string, number>()
      const typeCounts = new Map<string, number>()
      const priorityCounts = new Map<string, number>()
      let totalProcessingTime = 0
      let completedCount = 0

      detailsResult.data?.forEach((request: any) => {
        // Count by status
        statusCounts.set(request.status, (statusCounts.get(request.status) || 0) + 1)
        
        // Count by type
        const typeName = request.request_type?.display_name || 'Unknown'
        typeCounts.set(typeName, (typeCounts.get(typeName) || 0) + 1)
        
        // Count by priority
        priorityCounts.set(request.priority, (priorityCounts.get(request.priority) || 0) + 1)
        
        // Calculate processing time for completed requests
        if (request.completed_at && request.created_at) {
          const processingTime = new Date(request.completed_at).getTime() - new Date(request.created_at).getTime()
          totalProcessingTime += processingTime
          completedCount++
        }
      })

      const avgProcessingTime = completedCount > 0 
        ? Math.round(totalProcessingTime / completedCount / (1000 * 60 * 60 * 24)) // Convert to days
        : 0

      return {
        total,
        byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({
          status,
          count
        })),
        byType: Array.from(typeCounts.entries()).map(([type, count]) => ({
          type,
          count
        })),
        byPriority: Array.from(priorityCounts.entries()).map(([priority, count]) => ({
          priority,
          count
        })),
        avgProcessingTime
      }
    } catch (error) {
      this.handleError(error, 'RequestService.getRequestStats')
    }
  }

  /**
   * Subscribe to real-time updates for requests
   */
  subscribeToRequests(
    userId: string,
    onUpdate: (payload: any) => void,
    requestType?: string
  ) {
    let channel = this.supabase
      .channel('requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `requester_id=eq.${userId}`
        },
        onUpdate
      )

    // Also subscribe to request items changes
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'request_items'
      },
      onUpdate
    )

    // Subscribe to approval changes
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'request_approvals'
      },
      onUpdate
    )

    return channel.subscribe()
  }

  /**
   * Get user's request summary
   */
  async getUserRequestSummary(userId?: string): Promise<{
    total: number
    pending: number
    inProgress: number
    approved: number
    rejected: number
    cancelled: number
  }> {
    try {
      const currentUserId = userId || (await this.getCurrentUser()).id

      const { data, error } = await this.supabase
        .from('requests')
        .select('status')
        .eq('requester_id', currentUserId)

      if (error) throw error

      const summary = {
        total: 0,
        pending: 0,
        inProgress: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0
      }

      data?.forEach((request: any) => {
        summary.total++
        switch (request.status) {
          case 'pending':
            summary.pending++
            break
          case 'in_progress':
            summary.inProgress++
            break
          case 'approved':
            summary.approved++
            break
          case 'rejected':
            summary.rejected++
            break
          case 'cancelled':
            summary.cancelled++
            break
        }
      })

      return summary
    } catch (error) {
      this.handleError(error, 'RequestService.getUserRequestSummary')
    }
  }

  /**
   * Create request with automatic workflow assignment
   */
  async createRequestWithWorkflow(data: {
    title: string
    requestTypeId: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    payload?: any
    requestedDate?: string
    dueDate?: string
  }): Promise<RequestWithDetails> {
    try {
      const user = await this.getCurrentUser()
      const profile = await this.getCurrentUserProfile()

      // Get workflow assignment for this request type and user role
      const workflowAssignment = await workflowService.assignWorkflowToRequest(data.requestTypeId, profile.role_id)

      // Create the main request with workflow initialization
      const insertData: any = {
        title: data.title,
        request_type_id: data.requestTypeId,
        requester_id: user.id,
        status: workflowAssignment.status,
        priority: data.priority,
        payload: data.payload || {},
        requested_date: data.requestedDate,
        due_date: data.dueDate,
        workflow_id: workflowAssignment.workflowId,
        current_step_id: workflowAssignment.currentStepId
      }

      const { data: request, error } = await this.supabase
        .from('requests')
        .insert(insertData)
        .select(`
          *,
          requester:profiles!requester_id(full_name, email),
          request_type:request_types!request_type_id(name, display_name),
          workflow:approval_workflows(id, name),
          current_step:approval_steps(id, step_name, step_order)
        `)
        .single()

      if (error) throw error
      return request
    } catch (error) {
      this.handleError(error, 'RequestService.createRequestWithWorkflow')
    }
  }
}

export const requestService = new RequestService()
