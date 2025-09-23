import { BaseService } from './base-service'
import { workflowService } from './workflow-service'
import type { 
  RequestApproval,
  Request,
  RequestType,
  Profile,
  ApprovalStep,
  ApprovalAction,
  ApprovalActionWithItems,
  RequestWithDetails,
  RequestItem,
  ProcessRequestApprovalWithItemsRPCArgs,
  ProcessRequestApprovalWithItemsRPCResult,
  GetApprovedRequestsByApproverRPCArgs,
  GetApprovedRequestsByApproverRPCResult,
  ApprovalHistoryEntry,
  ApprovalHistoryPagination,
  ApprovalHistoryFilters,
} from '@/types/database'

/**
 * Service for handling approval processes
 */
export class ApprovalService extends BaseService {
  /**
   * Get requests pending approval for current user
   */
  async getPendingApprovalRequests(options: {
    requestTypeName?: string | string[]
    requestTypeId?: string | string[]
    includeItems?: boolean
  } = {}): Promise<RequestWithDetails[]> {
    try {
      const user = await this.getCurrentUser()
      console.log('🔍 Getting pending approvals for user:', user.id)
      
      const userProfile = await this.getCurrentUserProfile()
      const userRoleId = userProfile.role_id
      console.log('🔍 User profile and role:', { profileId: userProfile.id, roleId: userRoleId })

      // Build dynamic select clause using non-aliased names to keep filters stable
      let select = `
        *,
        request_types!inner(*),
        profiles!inner(*),
        approval_steps!inner(*)
      `

      if (options.includeItems) {
        select += `,
        request_items(*)
        `
      }

      let query = this.supabase
        .from('requests')
        .select(select)
        // Show requests awaiting first approval (pending) and those mid-workflow (in_progress)
        .in('status', ['pending', 'in_progress'])
        .not('current_step_id', 'is', null)
        .order('created_at', { ascending: false })

      // Apply approval visibility logic with proper syntax
      if (userRoleId) {
        // Use correct PostgREST OR syntax with proper comma separation
        query = query.or(
          `approver_employee_id.eq.${user.id},and(approver_employee_id.is.null,approver_role_id.eq.${userRoleId})`,
          { referencedTable: 'approval_steps' }
        )
      } else {
        // User has no role, can only see requests explicitly assigned to them
        query = query.eq('approval_steps.approver_employee_id', user.id)
      }

      // Apply optional filters by request type
      if (options.requestTypeId) {
        const ids = Array.isArray(options.requestTypeId) ? options.requestTypeId : [options.requestTypeId]
        query = query.in('request_type_id', ids)
      } else if (options.requestTypeName) {
        const names = Array.isArray(options.requestTypeName) ? options.requestTypeName : [options.requestTypeName]
        // filter by joined table column
        query = query.in('request_types.name', names)
      }

      const { data, error } = await query
      if (error) {
        console.error('🚨 Supabase query error:', error)
        throw error
      }

      const rows = (data ?? []) as unknown as Record<string, unknown>[]

      // Debug logging
      console.log('🔍 ApprovalService debug:', {
        queryIncludeItems: options.includeItems,
        rowCount: rows.length,
        includeItemsOption: options.includeItems,
        sampleRow: rows[0] ? {
          id: rows[0].id,
          title: rows[0].title,
          hasRequestItems: !!rows[0].request_items,
          requestItemsType: typeof rows[0].request_items,
          requestItemsLength: Array.isArray(rows[0].request_items) ? rows[0].request_items.length : 'not array',
          requestItemsRaw: rows[0].request_items
        } : null
      })

      // Type-safe mapping using proper Supabase response types
      return (
        rows.map((request: Record<string, unknown>): RequestWithDetails => {
          const requestTypes = request.request_types as Array<RequestType>
          const profiles = request.profiles as Array<Profile>
          const approvalSteps = request.approval_steps as Array<ApprovalStep>
          const requestItems = request.request_items as Array<RequestItem> | undefined

          return {
            ...(request as Request),
            request_type: Array.isArray(requestTypes) ? requestTypes[0] : (requestTypes as unknown as RequestType),
            requester: Array.isArray(profiles) ? profiles[0] : (profiles as unknown as Profile),
            current_step: Array.isArray(approvalSteps) ? approvalSteps[0] : (approvalSteps as unknown as ApprovalStep),
            items: requestItems ? requestItems : undefined
          }
        }) || []
      )
    } catch (error) {
      this.handleError(error, 'ApprovalService.getPendingApprovalRequests')
      return []
    }
  }

  /**
   * Process approval (approve or reject) - Backward compatibility wrapper
   */
  async processApproval(
    requestId: string,
    action: ApprovalAction
  ): Promise<{ success: boolean; newStatus: string; message: string }> {
    // Delegate to enhanced method without items update
    const enhancedAction: ApprovalActionWithItems = {
      ...action,
      updatedItems: undefined // No items update for backward compatibility
    }
    
    return this.processApprovalWithItems(requestId, enhancedAction)
  }

  /**
   * Process approval with items update (Enhanced version)
   */
  async processApprovalWithItems(
    requestId: string,
    action: ApprovalActionWithItems
  ): Promise<{ success: boolean; newStatus: string; message: string }> {
    try {
      const user = await this.getCurrentUser()

      // Get current request with workflow info
      const { data: request, error: requestError } = await this.supabase
        .from('requests')
        .select(`
          id,
          status,
          current_step_id,
          workflow_id,
          approval_steps!inner(
            id,
            step_order,
            workflow_id,
            approver_role_id,
            approver_employee_id
          )
        `)
        .eq('id', requestId)
        .single()

      if (requestError) throw requestError

      if (!request.current_step_id) {
        throw new Error('Request has no current approval step')
      }

      // Verify user can approve this step
      const canApprove = await workflowService.canUserApproveStep(request.current_step_id, user.id)
      if (!canApprove) {
        throw new Error('User is not authorized to approve this step')
      }

      // Check if approval already exists for this request and step
      const { data: existingApproval, error: checkError } = await this.supabase
        .from('request_approvals')
        .select('id, status')
        .eq('request_id', requestId)
        .eq('step_id', request.current_step_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no approval exists
        throw checkError
      }

      if (existingApproval) {
        // Approval already exists, return the current status
        return {
          success: true,
          newStatus: request.status,
          message: `Request has already been ${existingApproval.status}`
        }
      }

      // Determine new status and next step based on action
      let newStatus: string = request.status
      let newCurrentStepId: string | null = request.current_step_id
      
      if (action.action === 'reject') {
        newStatus = 'rejected'
        newCurrentStepId = null
      } else {
        // Find next step for approval
        const currentStep = await workflowService.getApprovalStepById(request.current_step_id)
        if (!currentStep) {
          throw new Error('Current approval step not found')
        }

        const nextStep = await workflowService.getNextApprovalStep(
          request.workflow_id,
          currentStep.step_order
        )

        if (nextStep) {
          newCurrentStepId = nextStep.id
          newStatus = 'in_progress'
        } else {
          // No more steps, fully approved
          newStatus = 'approved'
          newCurrentStepId = null
        }
      }

      // Use enhanced RPC function for atomic approval processing
      const rpcArgs: ProcessRequestApprovalWithItemsRPCArgs = {
        p_request_id: requestId,
        p_step_id: request.current_step_id,
        p_approver_id: user.id,
        p_approval_status: action.action === 'approve' ? 'approved' : 'rejected',
        p_comments: action.comments || '',
        p_new_status: newStatus,
        p_new_step_id: newCurrentStepId,
        // Use database field names as trusted source - no dual mapping
        p_updated_items: action.updatedItems?.map(item => ({
          id: item.id,
          item_name: item.item_name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit
        }))
      }

      const { data: result, error: functionError } = await this.supabase
        .rpc('process_request_approval_with_items', rpcArgs)

      if (functionError) {
        console.error('Database function error:', functionError)
        throw new Error(`Failed to process approval: ${functionError.message}`)
      }

      // Extract result from RPC response
      const functionResult: ProcessRequestApprovalWithItemsRPCResult = Array.isArray(result) ? result[0] : result

      if (!functionResult?.success) {
        throw new Error(functionResult?.message || 'Approval processing failed')
      }

      return {
        success: functionResult.success,
        newStatus: functionResult.new_status,
        message: functionResult.message
      }
    } catch (error) {
      this.handleError(error, 'ApprovalService.processApprovalWithItems')
      throw error
    }
  }

  /**
   * Validate that all item IDs exist in the database for the given request
   */
  private async validateItemIds(requestId: string, itemIds: string[]): Promise<{ valid: boolean; missingIds: string[] }> {
    try {
      const { data: existingItems, error } = await this.supabase
        .from('request_items')
        .select('id')
        .eq('request_id', requestId)
        .in('id', itemIds)

      if (error) {
        console.error('Error validating item IDs:', error)
        return { valid: false, missingIds: itemIds }
      }

      const existingIds = existingItems?.map(item => item.id) || []
      const missingIds = itemIds.filter(id => !existingIds.includes(id))

      return {
        valid: missingIds.length === 0,
        missingIds
      }
    } catch (error) {
      console.error('Error in item validation:', error)
      return { valid: false, missingIds: itemIds }
    }
  }

  /**
   * Get approval history for a request
   */
  async getApprovalHistory(requestId: string): Promise<RequestApproval[]> {
    try {
      const { data, error } = await this.supabase
        .from('request_approvals')
        .select(`
          *,
          approver:profiles!approver_id(full_name, email),
          step:approval_steps!step_id(step_name, step_order)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'ApprovalService.getApprovalHistory')
    }
  }

  /**
   * Check if user can approve a specific request
   */
  async canUserApproveRequest(requestId: string, userId?: string): Promise<boolean> {
    try {
      const currentUserId = userId || (await this.getCurrentUser()).id

      const { data: request, error } = await this.supabase
        .from('requests')
        .select('current_step_id')
        .eq('id', requestId)
        .single()

      if (error || !request.current_step_id) return false

      return await workflowService.canUserApproveStep(request.current_step_id, currentUserId)
    } catch (error) {
      console.error('Error checking approval permission:', error)
      return false
    }
  }

  /**
   * Get requests approved by current user
   */
  async getApprovedByUser(userId?: string): Promise<RequestApproval[]> {
    try {
      const currentUserId = userId || (await this.getCurrentUser()).id

      const { data, error } = await this.supabase
        .from('request_approvals')
        .select(`
          *,
          request:requests!request_id(
            id,
            title,
            status,
            priority,
            created_at,
            request_number,
            request_types(name, display_name)
          ),
          step:approval_steps!step_id(step_name, step_order),
          approver:profiles!approver_id(full_name, email)
        `)
        .eq('approver_id', currentUserId)
        .order('approved_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'ApprovalService.getApprovedByUser')
    }
  }

  /**
   * Get approved requests history for current user using RPC function
   * This method uses the get_approved_requests_by_approver RPC function for better performance
   * and more advanced filtering capabilities
   */
  async getApprovedRequestsByApprover(options: {
    page?: number
    pageSize?: number
    status?: string | null
    priority?: string | null
    searchQuery?: string | null
    dateFrom?: string | null
    dateTo?: string | null
    sortBy?: string
    sortOrder?: string
  } = {}): Promise<{
    data: ApprovalHistoryEntry[]
    pagination: ApprovalHistoryPagination
    filters: ApprovalHistoryFilters
  }> {
    try {
      const user = await this.getCurrentUser()

      // Prepare filters object
      const filters: ApprovalHistoryFilters = {
        status: options.status ?? null,
        priority: options.priority ?? null,
        searchQuery: options.searchQuery ?? null,
        dateFrom: options.dateFrom ?? null,
        dateTo: options.dateTo ?? null,
        sortBy: options.sortBy ?? 'approved_at',
        sortOrder: options.sortOrder ?? 'desc'
      }

      // Prepare RPC arguments
      const rpcArgs: GetApprovedRequestsByApproverRPCArgs = {
        p_approver_id: user.id,
        p_filters: JSON.stringify(filters)
      }

      // Call the RPC function
      const { data, error } = await this.supabase
        .rpc('get_approved_requests_by_approver', rpcArgs)

      if (error) {
        console.error('Error calling get_approved_requests_by_approver RPC:', error)
        throw error
      }

      // Extract result from RPC response
      const result: GetApprovedRequestsByApproverRPCResult = Array.isArray(data) ? data[0] : data

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to get approved requests history')
      }

      return {
        data: result.data || [],
        pagination: result.pagination,
        filters: result.filters
      }
    } catch (error) {
      this.handleError(error, 'ApprovalService.getApprovedRequestsByApprover')
      return {
        data: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: options.page || 1,
          pageSize: options.pageSize || 20,
          hasNextPage: false,
          hasPreviousPage: false
        },
        filters: {
          status: options.status ?? null,
          priority: options.priority ?? null,
          searchQuery: options.searchQuery ?? null,
          dateFrom: options.dateFrom ?? null,
          dateTo: options.dateTo ?? null,
          sortBy: options.sortBy ?? 'approved_at',
          sortOrder: options.sortOrder ?? 'desc'
        }
      }
    }
  }

  /**
   * Get pending approvals count for current user
   */
  async getPendingApprovalsCount(
    userId?: string,
    options: {
      requestTypeName?: string | string[]
      requestTypeId?: string | string[]
    } = {}
  ): Promise<number> {
    try {
      const currentUserId = userId || (await this.getCurrentUser()).id
      const userRoleId = await this.getCurrentUserRoleId()

      // Include joins in select to enable filtering on embedded relations while counting
      let query = this.supabase
        .from('requests')
        .select('id, approval_steps!inner(id), request_types!inner(id)', { count: 'exact', head: true })
        // Count both 'pending' (first step) and 'in_progress' (subsequent steps)
        .in('status', ['pending', 'in_progress'])
        .not('current_step_id', 'is', null)

      // Apply same approval visibility logic as getPendingApprovalRequests
      if (userRoleId) {
        query = query.or(
          `approver_employee_id.eq.${currentUserId},and(approver_employee_id.is.null,approver_role_id.eq.${userRoleId})`,
          { referencedTable: 'approval_steps' }
        )
      } else {
        // User has no role, can only see requests explicitly assigned to them
        query = query.eq('approval_steps.approver_employee_id', currentUserId)
      }

      if (options.requestTypeId) {
        const ids = Array.isArray(options.requestTypeId) ? options.requestTypeId : [options.requestTypeId]
        query = query.in('request_type_id', ids)
      } else if (options.requestTypeName) {
        const names = Array.isArray(options.requestTypeName) ? options.requestTypeName : [options.requestTypeName]
        query = query.in('request_types.name', names)
      }

      const { count, error } = await query

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting pending approvals count:', error)
      return 0
    }
  }
}

export const approvalService = new ApprovalService()
