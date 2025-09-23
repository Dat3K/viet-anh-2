import { BaseService } from './base-service'
import type {
  PendingApprovalRequest,
  RequestApprovalWithDetails,
  RequestWithDetails,
  ProcessRequestApprovalWithItemsRPCArgs,
  ProcessRequestApprovalWithItemsRPCResult,
  UpdatedRequestItem,
  GetPendingApprovalsByRoleRPCArgs
} from '@/types/database'

/**
 * Service for handling request approval operations
 * Extends BaseService to leverage common functionality
 */
export class RequestApprovalService extends BaseService {
  /**
   * Get pending approval requests for a user
   */
  async getPendingRequests(userId: string, roleId: string): Promise<PendingApprovalRequest[]> {
    try {
      // Use the RPC function to get pending approvals
      const rpcArgs: GetPendingApprovalsByRoleRPCArgs = {
        p_user_id: userId,
        p_role_id: roleId
      }

      const { data, error } = await this.supabase
        .rpc('get_pending_approvals_by_role', rpcArgs)

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestApprovalService.getPendingRequests')
    }
  }

  /**
   * Approve a request
   */
  async approveRequest(
    requestId: string,
    stepId: string,
    approverId: string,
    comments?: string,
    updatedItems?: UpdatedRequestItem[]
  ): Promise<ProcessRequestApprovalWithItemsRPCResult> {
    try {
      const rpcArgs: ProcessRequestApprovalWithItemsRPCArgs = {
        p_request_id: requestId,
        p_step_id: stepId,
        p_approver_id: approverId,
        p_approval_status: 'approved',
        p_comments: comments || '',
        p_new_status: '', // Will be determined by the RPC function
        p_new_step_id: null, // Will be determined by the RPC function
        p_updated_items: updatedItems
      }

      const { data, error } = await this.supabase
        .rpc('process_request_approval_with_items', rpcArgs)

      if (error) throw error
      
      // Extract result from RPC response
      const result: ProcessRequestApprovalWithItemsRPCResult = Array.isArray(data) ? data[0] : data
      return result
    } catch (error) {
      this.handleError(error, 'RequestApprovalService.approveRequest')
    }
  }

  /**
   * Reject a request
   */
  async rejectRequest(
    requestId: string,
    stepId: string,
    approverId: string,
    comments?: string
  ): Promise<ProcessRequestApprovalWithItemsRPCResult> {
    try {
      const rpcArgs: ProcessRequestApprovalWithItemsRPCArgs = {
        p_request_id: requestId,
        p_step_id: stepId,
        p_approver_id: approverId,
        p_approval_status: 'rejected',
        p_comments: comments || '',
        p_new_status: 'rejected',
        p_new_step_id: null,
        p_updated_items: undefined
      }

      const { data, error } = await this.supabase
        .rpc('process_request_approval_with_items', rpcArgs)

      if (error) throw error
      
      // Extract result from RPC response
      const result: ProcessRequestApprovalWithItemsRPCResult = Array.isArray(data) ? data[0] : data
      return result
    } catch (error) {
      this.handleError(error, 'RequestApprovalService.rejectRequest')
    }
  }

  /**
   * Get approval history for a request
   */
  async getApprovalHistory(requestId: string): Promise<RequestApprovalWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('request_approvals')
        .select(`
          *,
          approver:profiles!approver_id(full_name, email),
          step:approval_steps!step_id(step_name, step_order),
          request:requests!request_id(title)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestApprovalService.getApprovalHistory')
    }
  }

  /**
   * Check if user can approve a request
   */
  async canUserApprove(userId: string, requestId: string): Promise<boolean> {
    try {
      // First get the request with its current step
      const { data: request, error: requestError } = await this.supabase
        .from('requests')
        .select('current_step_id')
        .eq('id', requestId)
        .single()

      if (requestError || !request?.current_step_id) {
        return false
      }

      // Check if user can approve this step
      const { data: step, error: stepError } = await this.supabase
        .from('approval_steps')
        .select('approver_employee_id, approver_role_id')
        .eq('id', request.current_step_id)
        .single()

      if (stepError || !step) {
        return false
      }

      // Check if user is the specific approver or has the approver role
      if (step.approver_employee_id === userId) {
        return true
      }

      if (step.approver_role_id) {
        const userProfile = await this.getCurrentUserProfile()
        return userProfile.role_id === step.approver_role_id
      }

      return false
    } catch (error) {
      this.handleError(error, 'RequestApprovalService.canUserApprove')
    }
  }

  /**
   * Get requests approved by a user
   */
  async getApprovedByUser(userId: string): Promise<RequestWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .select(`
          *,
          requester:profiles!requester_id(full_name, email),
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
        .eq('approvals.approver_id', userId)
        .eq('approvals.status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestApprovalService.getApprovedByUser')
    }
  }

  /**
   * Get count of pending approvals for a user
   */
  async getPendingApprovalsCount(userId: string, roleId: string): Promise<number> {
    try {
      // Use the same RPC function as getPendingRequests but only get count
      const rpcArgs: GetPendingApprovalsByRoleRPCArgs = {
        p_user_id: userId,
        p_role_id: roleId
      }

      const { data, error } = await this.supabase
        .rpc('get_pending_approvals_by_role', rpcArgs)

      if (error) throw error
      
      // Return the count of pending approvals
      return data ? data.length : 0
    } catch (error) {
      this.handleError(error, 'RequestApprovalService.getPendingApprovalsCount')
    }
  }
}

export const requestApprovalService = new RequestApprovalService()