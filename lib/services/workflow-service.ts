import { BaseService } from './base-service'
import type { 
  ApprovalWorkflowWithSteps,
  ApprovalStep
} from '@/types/database'


/**
 * Service for managing approval workflows
 */
export class WorkflowService extends BaseService {
  /**
   * Get workflow for a specific request type and user role
   */
  async getWorkflowForRequest(requestTypeId: string, userRoleId: string): Promise<ApprovalWorkflowWithSteps | null> {
    try {
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .select(`
          id,
          name,
          description,
          request_type_id,
          role_id,
          is_active,
          created_at,
          updated_at,
          approval_steps(
            id,
            workflow_id,
            step_order,
            approver_role_id,
            approver_employee_id,
            step_name,
            is_required,
            created_at
          )
        `)
        .eq('request_type_id', requestTypeId)
        .eq('role_id', userRoleId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'WorkflowService.getWorkflowForRequest')
    }
  }

  /**
   * Get all active workflows
   */
  async getAllActiveWorkflows(): Promise<ApprovalWorkflowWithSteps[]> {
    try {
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .select(`
          id,
          name,
          description,
          request_type_id,
          role_id,
          is_active,
          created_at,
          updated_at,
          approval_steps(
            id,
            workflow_id,
            step_order,
            approver_role_id,
            approver_employee_id,
            step_name,
            is_required,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'WorkflowService.getAllActiveWorkflows')
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<ApprovalWorkflowWithSteps | null> {
    try {
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .select(`
          id,
          name,
          description,
          request_type_id,
          role_id,
          is_active,
          created_at,
          updated_at,
          approval_steps(
            id,
            workflow_id,
            step_order,
            approver_role_id,
            approver_employee_id,
            step_name,
            is_required,
            created_at
          )
        `)
        .eq('id', workflowId)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'WorkflowService.getWorkflowById')
    }
  }

  /**
   * Get first approval step for a workflow
   */
  getFirstApprovalStep(workflow: ApprovalWorkflowWithSteps): ApprovalStep | null {
    if (!workflow.approval_steps || workflow.approval_steps.length === 0) {
      return null
    }

    const sortedSteps = workflow.approval_steps?.sort((a: ApprovalStep, b: ApprovalStep) => a.step_order - b.step_order)
    return sortedSteps[0]
  }

  /**
   * Get next approval step after current step
   */
  async getNextApprovalStep(workflowId: string, currentStepOrder: number): Promise<ApprovalStep | null> {
    try {
      const { data, error } = await this.supabase
        .from('approval_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .gt('step_order', currentStepOrder)
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'WorkflowService.getNextApprovalStep')
    }
  }

  /**
   * Get approval step by ID
   */
  async getApprovalStepById(stepId: string): Promise<ApprovalStep | null> {
    try {
      const { data, error } = await this.supabase
        .from('approval_steps')
        .select('*')
        .eq('id', stepId)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'WorkflowService.getApprovalStepById')
    }
  }

  /**
   * Check if user can approve at a specific step
   * If step has approver_employee_id, only that user can approve
   * If step has no approver_employee_id, fall back to role-based approval
   */
  async canUserApproveStep(stepId: string, userId: string): Promise<boolean> {
    try {
      const step = await this.getApprovalStepById(stepId)
      if (!step) return false

      // If step has a specific approver assigned, only that user can approve
      if (step.approver_employee_id !== null) {
        return step.approver_employee_id === userId
      }

      // If no specific approver, check if user's role matches the step's required role
      if (step.approver_role_id) {
        const userRoleId = await this.getCurrentUserRoleId()
        return userRoleId === step.approver_role_id
      }

      return false
    } catch (error) {
      this.handleError(error, 'WorkflowService.canUserApproveStep')
    }
  }

  /**
   * Get workflows that user can participate in (as approver)
   */
  async getWorkflowsForApprover(userId?: string): Promise<ApprovalWorkflowWithSteps[]> {
    try {
      const currentUserId = userId || (await this.getCurrentUser()).id
      const userRoleId = await this.getCurrentUserRoleId()

      const { data, error } = await this.supabase
        .from('approval_workflows')
        .select(`
          *,
          approval_steps!inner(
            *
          )
        `)
        .eq('is_active', true)
        .or(`and(approver_employee_id.eq.${currentUserId}),and(approver_employee_id.is.null,approver_role_id.eq.${userRoleId})`, 
            { referencedTable: 'approval_steps' })

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'WorkflowService.getWorkflowsForApprover')
    }
  }

  /**
   * Automatically assign workflow to request based on request type and user role
   */
  async assignWorkflowToRequest(requestTypeId: string, userRoleId: string): Promise<{
    workflowId: string | null
    currentStepId: string | null
    status: 'pending' | 'approved'
  }> {
    try {
      // Find matching workflow based on request_type_id and user's role_id
      const workflow = await this.getWorkflowForRequest(requestTypeId, userRoleId)
      
      if (workflow && workflow.approval_steps && workflow.approval_steps.length > 0) {
        // Get first approval step
        const firstStep = this.getFirstApprovalStep(workflow)
        
        if (firstStep) {
          return {
            workflowId: workflow.id,
            currentStepId: firstStep.id,
            status: 'pending'
          }
        }
      }
      
      // No workflow found or no steps, auto-approve
      return {
        workflowId: null,
        currentStepId: null,
        status: 'approved'
      }
    } catch (error) {
      console.error('Error assigning workflow to request:', error)
      // On error, default to auto-approve
      return {
        workflowId: null,
        currentStepId: null,
        status: 'approved'
      }
    }
  }

  /**
   * Get workflow assignment for current user and request type
   */
  async getWorkflowAssignmentForCurrentUser(requestTypeId: string): Promise<{
    workflowId: string | null
    currentStepId: string | null
    status: 'pending' | 'approved'
  }> {
    try {
      const userRoleId = await this.getCurrentUserRoleId()
      return await this.assignWorkflowToRequest(requestTypeId, userRoleId)
    } catch (error) {
      this.handleError(error, 'WorkflowService.getWorkflowAssignmentForCurrentUser')
    }
  }
}

export const workflowService = new WorkflowService()
