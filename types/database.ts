import type { 
  Tables, 
  TablesInsert, 
  TablesUpdate,
} from './database.types.ts'

// =============================================================================
// Table Row Types
// =============================================================================

export type ApprovalStep = Tables<'approval_steps'>
export type ApprovalWorkflow = Tables<'approval_workflows'>
export type AuditLog = Tables<'audit_logs'>
export type Department = Tables<'departments'>
export type Profile = Tables<'profiles'>
export type RequestApproval = Tables<'request_approvals'>
export type RequestType = Tables<'request_types'>
export type Role = Tables<'roles'>
export type SupplyRequestItem = Tables<'supply_request_items'>
export type SupplyRequest = Tables<'supply_requests'>

// =============================================================================
// Table Insert Types
// =============================================================================

export type ApprovalStepInsert = TablesInsert<'approval_steps'>
export type ApprovalWorkflowInsert = TablesInsert<'approval_workflows'>
export type AuditLogInsert = TablesInsert<'audit_logs'>
export type DepartmentInsert = TablesInsert<'departments'>
export type ProfileInsert = TablesInsert<'profiles'>
export type RequestApprovalInsert = TablesInsert<'request_approvals'>
export type RequestTypeInsert = TablesInsert<'request_types'>
export type RoleInsert = TablesInsert<'roles'>
export type SupplyRequestItemInsert = TablesInsert<'supply_request_items'>
export type SupplyRequestInsert = TablesInsert<'supply_requests'>

// =============================================================================
// Table Update Types
// =============================================================================

export type ApprovalStepUpdate = TablesUpdate<'approval_steps'>
export type ApprovalWorkflowUpdate = TablesUpdate<'approval_workflows'>
export type AuditLogUpdate = TablesUpdate<'audit_logs'>
export type DepartmentUpdate = TablesUpdate<'departments'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type RequestApprovalUpdate = TablesUpdate<'request_approvals'>
export type RequestTypeUpdate = TablesUpdate<'request_types'>
export type RoleUpdate = TablesUpdate<'roles'>
export type SupplyRequestItemUpdate = TablesUpdate<'supply_request_items'>
export type SupplyRequestUpdate = TablesUpdate<'supply_requests'>

// =============================================================================
// Enum Types
// =============================================================================

// Currently no enums are defined in the database schema

// =============================================================================
// Common Union Types
// =============================================================================

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type UserRole = 'user' | 'admin' | 'manager' | 'approver'

// =============================================================================
// Utility Types for Common Operations
// =============================================================================

export type CreateRequest = Omit<SupplyRequestInsert, 'id' | 'created_at' | 'updated_at' | 'request_number'>
export type UpdateRequest = Pick<SupplyRequestUpdate, 'title' | 'description' | 'due_date' | 'priority' | 'status'>

// =============================================================================
// Extended Types with Relationships
// =============================================================================

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
  role?: Role
}

export type ApprovalWorkflowWithSteps = ApprovalWorkflow & {
  request_type?: RequestType
  role?: Role
  approval_steps?: ApprovalStep[]
}

export type ApprovalStepWithDetails = ApprovalStep & {
  approver_employee?: Profile
  approver_role?: Role
  workflow?: ApprovalWorkflow
}

export type RequestApprovalWithDetails = RequestApproval & {
  approver?: Profile
  step?: ApprovalStep
  supply_request?: SupplyRequest
}

// =============================================================================
// Type Guards
// =============================================================================