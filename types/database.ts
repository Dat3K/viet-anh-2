import type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

// =============================================================================
// Type Aliases for easier usage
// =============================================================================

// Table Row Types
export type ApprovalStep = Tables<'approval_steps'>
export type ApprovalWorkflow = Tables<'approval_workflows'>
export type AuditLog = Tables<'audit_logs'>
export type Department = Tables<'departments'>
export type Position = Tables<'positions'>
export type Profile = Tables<'profiles'>
export type RequestApproval = Tables<'request_approvals'>
export type RequestType = Tables<'request_types'>
export type SupplyRequestItem = Tables<'supply_request_items'>
export type SupplyRequest = Tables<'supply_requests'>

// Table Insert Types
export type ApprovalStepInsert = TablesInsert<'approval_steps'>
export type ApprovalWorkflowInsert = TablesInsert<'approval_workflows'>
export type AuditLogInsert = TablesInsert<'audit_logs'>
export type DepartmentInsert = TablesInsert<'departments'>
export type PositionInsert = TablesInsert<'positions'>
export type ProfileInsert = TablesInsert<'profiles'>
export type RequestApprovalInsert = TablesInsert<'request_approvals'>
export type RequestTypeInsert = TablesInsert<'request_types'>
export type SupplyRequestItemInsert = TablesInsert<'supply_request_items'>
export type SupplyRequestInsert = TablesInsert<'supply_requests'>

// Table Update Types
export type ApprovalStepUpdate = TablesUpdate<'approval_steps'>
export type ApprovalWorkflowUpdate = TablesUpdate<'approval_workflows'>
export type AuditLogUpdate = TablesUpdate<'audit_logs'>
export type DepartmentUpdate = TablesUpdate<'departments'>
export type PositionUpdate = TablesUpdate<'positions'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type RequestApprovalUpdate = TablesUpdate<'request_approvals'>
export type RequestTypeUpdate = TablesUpdate<'request_types'>
export type SupplyRequestItemUpdate = TablesUpdate<'supply_request_items'>
export type SupplyRequestUpdate = TablesUpdate<'supply_requests'>

// Function Return Types
export type AdminUser = Database['public']['Functions']['admin_get_all_users']['Returns'][number]
export type RequestApprover = Database['public']['Functions']['get_request_approvers']['Returns'][number]

// Commonly used union types
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type UserRole = 'user' | 'admin' | 'manager' | 'approver'

// Utility types for common operations
export type CreateRequest = Omit<SupplyRequestInsert, 'id' | 'created_at' | 'updated_at' | 'request_number'>
export type UpdateRequest = Pick<SupplyRequestUpdate, 'title' | 'description' | 'due_date' | 'priority' | 'status'>

// Extended types with relationships
export type SupplyRequestWithDetails = SupplyRequest & {
  requester?: Profile
  request_type?: RequestType
  workflow?: ApprovalWorkflow
  current_step?: ApprovalStep
  items?: SupplyRequestItem[]
  approvals?: RequestApproval[]
}

export type ProfileWithDetails = Profile & {
  department?: Department
  position?: Position
  manager?: Profile
}

export type ApprovalWorkflowWithSteps = ApprovalWorkflow & {
  department?: Department
  position?: Position
  request_type?: RequestType
  approval_steps?: ApprovalStep[]
}

export type ApprovalStepWithDetails = ApprovalStep & {
  approver_employee?: Profile
  approver_position?: Position
  workflow?: ApprovalWorkflow
}

export type RequestApprovalWithDetails = RequestApproval & {
  approver?: Profile
  step?: ApprovalStep
  supply_request?: SupplyRequest
}
