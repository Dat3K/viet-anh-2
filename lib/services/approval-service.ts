import { BaseService } from './base-service'
import { workflowService } from './workflow-service'
import type { 
  RequestApproval,
  Request,
  RequestType,
  Profile,
  ApprovalStep,
  ApprovalAction,
  PendingApprovalRequest
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
  } = {}): Promise<PendingApprovalRequest[]> {
    try {
      const user = await this.getCurrentUser()
      const userRoleId = await this.getCurrentUserRoleId()

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
        // Approver can be explicitly assigned or via role.
        // Guard against null/undefined role to avoid generating invalid eq.null
        // and scope OR to the joined approval_steps table to avoid PostgREST parse issues.
        .or(
          `approver_employee_id.eq.${user.id}` + (userRoleId ? `,approver_role_id.eq.${userRoleId}` : ''),
          { referencedTable: 'approval_steps' }
        )
        .order('created_at', { ascending: false })

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
      if (error) throw error

      const rows = (data ?? []) as unknown as Record<string, unknown>[]

      // Type-safe mapping using proper Supabase response types
      return (
        rows.map((request: Record<string, unknown>): PendingApprovalRequest => {
          const requestTypes = request.request_types as Array<RequestType>
          const profiles = request.profiles as Array<Profile>
          const approvalSteps = request.approval_steps as Array<ApprovalStep>

          return {
            ...(request as Request),
            request_type: Array.isArray(requestTypes) ? requestTypes[0] : (requestTypes as unknown as RequestType),
            requester: Array.isArray(profiles) ? profiles[0] : (profiles as unknown as Profile),
            current_step: Array.isArray(approvalSteps) ? approvalSteps[0] : (approvalSteps as unknown as ApprovalStep)
          }
        }) || []
      )
    } catch (error) {
      this.handleError(error, 'ApprovalService.getPendingApprovalRequests')
    }
  }

  /**
   * Process approval (approve or reject)
   */
  async processApproval(
    requestId: string,
    action: ApprovalAction
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

      // Create approval record
      const { error: approvalError } = await this.supabase
        .from('request_approvals')
        .insert({
          request_id: requestId,
          step_id: request.current_step_id,
          approver_id: user.id,
          status: action.action === 'approve' ? 'approved' : 'rejected',
          comments: action.comments || null,
          approved_at: this.getCurrentTimestamp(),
          created_at: this.getCurrentTimestamp()
        })

      if (approvalError) throw approvalError

      let newStatus = request.status
      let newCurrentStepId = request.current_step_id
      let message = ''

      if (action.action === 'reject') {
        newStatus = 'rejected'
        newCurrentStepId = null
        message = 'Request has been rejected'
      } else {
        // Find next step
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
          message = `Request approved and moved to next step: ${nextStep.step_name}`
        } else {
          // No more steps, fully approved
          newStatus = 'approved'
          newCurrentStepId = null
          message = 'Request has been fully approved'
        }
      }

      // Update request status
      const { error: updateError } = await this.supabase
        .from('requests')
        .update({
          status: newStatus,
          current_step_id: newCurrentStepId,
          completed_at: newStatus === 'approved' || newStatus === 'rejected' 
            ? this.getCurrentTimestamp() 
            : null,
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      return {
        success: true,
        newStatus,
        message
      }
    } catch (error) {
      this.handleError(error, 'ApprovalService.processApproval')
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
            created_at,
            request_types!inner(name, display_name)
          ),
          step:approval_steps!step_id(step_name, step_order)
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
        // Apply OR on the joined approval_steps table; skip role condition if not available
        .or(
          `approver_employee_id.eq.${currentUserId}` + (userRoleId ? `,approver_role_id.eq.${userRoleId}` : ''),
          { referencedTable: 'approval_steps' }
        )

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
