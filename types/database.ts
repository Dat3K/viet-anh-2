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
export type RequestItem = Tables<'request_items'>
export type Request = Tables<'requests'>
export type RequestType = Tables<'request_types'>
export type Role = Tables<'roles'>

// =============================================================================
// Table Insert Types
// =============================================================================

export type ApprovalStepInsert = TablesInsert<'approval_steps'>
export type ApprovalWorkflowInsert = TablesInsert<'approval_workflows'>
export type AuditLogInsert = TablesInsert<'audit_logs'>
export type DepartmentInsert = TablesInsert<'departments'>
export type ProfileInsert = TablesInsert<'profiles'>
export type RequestApprovalInsert = TablesInsert<'request_approvals'>
export type RequestItemInsert = TablesInsert<'request_items'>
export type RequestInsert = TablesInsert<'requests'>
export type RequestTypeInsert = TablesInsert<'request_types'>
export type RoleInsert = TablesInsert<'roles'>

// =============================================================================
// Table Update Types
// =============================================================================

export type ApprovalStepUpdate = TablesUpdate<'approval_steps'>
export type ApprovalWorkflowUpdate = TablesUpdate<'approval_workflows'>
export type AuditLogUpdate = TablesUpdate<'audit_logs'>
export type DepartmentUpdate = TablesUpdate<'departments'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type RequestApprovalUpdate = TablesUpdate<'request_approvals'>
export type RequestItemUpdate = TablesUpdate<'request_items'>
export type RequestUpdate = TablesUpdate<'requests'>
export type RequestTypeUpdate = TablesUpdate<'request_types'>
export type RoleUpdate = TablesUpdate<'roles'>

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

// =============================================================================
// Utility Types for Common Operations
// =============================================================================

export type CreateRequest = Omit<RequestInsert, 'id' | 'created_at' | 'updated_at' | 'request_number'>
export type UpdateRequest = Pick<RequestUpdate, 'title' | 'due_date' | 'priority' | 'status'>

// =============================================================================
// Extended Types with Relationships
// =============================================================================

export type RequestWithDetails = Request & {
  requester?: Profile
  request_type?: RequestType
  workflow?: ApprovalWorkflow
  current_step?: ApprovalStep
  items?: RequestItem[]
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
  approver_employee_id?: Profile
  approver_role?: Role
  workflow?: ApprovalWorkflow
}

export type RequestApprovalWithDetails = RequestApproval & {
  approver?: Profile
  step?: ApprovalStep
  request?: Request
}

// =============================================================================
// Extended Service Types
// =============================================================================

// Workflow Service Types
export interface WorkflowWithFullDetails extends ApprovalWorkflowWithSteps {
  request_type?: RequestType
  role?: Role
}

// Role Service Types
export interface RoleWithDepartment extends Role {
  department?: Department
  parent_role_info?: Role
  child_roles?: Role[]
}

// Supply Request Service Types
export interface SupplyRequest extends Request {
  payload: {
    purpose: string
    requestedDate: string
  }
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface SupplyRequestItem extends Omit<RequestItem, 'item_name' | 'description'> {
  name: string // Maps to item_name in database
  notes?: string // Maps to description in database
}

export interface CreateSupplyRequestPayload {
  title: string
  purpose: string
  requestedDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  items: Array<{
    name: string
    quantity: number
    unit: string
    notes?: string
  }>
}

export interface SupplyRequestWithItems extends SupplyRequest {
  items: SupplyRequestItem[]
}

// Approval Service Types
export interface ApprovalAction {
  action: 'approve' | 'reject'
  comments?: string
}

export interface PendingApprovalRequest extends Request {
  request_type: RequestType
  requester: Profile
  current_step: ApprovalStep
}

// =============================================================================
// Type Guards
// =============================================================================