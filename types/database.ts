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
// Table Insert Types (Only commonly used ones)
// =============================================================================

export type ProfileInsert = TablesInsert<'profiles'>
export type RequestInsert = TablesInsert<'requests'>
export type RequestItemInsert = TablesInsert<'request_items'>
export type RequestApprovalInsert = TablesInsert<'request_approvals'>
export type DepartmentInsert = TablesInsert<'departments'>
export type RequestTypeInsert = TablesInsert<'request_types'>

// =============================================================================
// Table Update Types (Only commonly used ones)
// =============================================================================

export type ProfileUpdate = TablesUpdate<'profiles'>
export type RequestUpdate = TablesUpdate<'requests'>
export type RequestItemUpdate = TablesUpdate<'request_items'>
export type DepartmentUpdate = TablesUpdate<'departments'>
export type RequestTypeUpdate = TablesUpdate<'request_types'>


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
export type CreateRequestItem = Omit<RequestItemInsert, 'id' | 'created_at' | 'updated_at'>

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
// RPC Function Types
// =============================================================================

// Create Supply Request RPC Types
export interface CreateSupplyRequestRPCArgs {
  p_requester_id: string
  p_role_id: string
  p_title: string
  p_purpose: string
  p_requested_date: string
  p_priority: string
  p_items: string // JSON string
}

export interface CreateSupplyRequestRPCResult {
  success: boolean
  message: string
  request_data?: SupplyRequestWithItems
}

// Get Pending Approvals RPC Types
export interface GetPendingApprovalsByRoleRPCArgs {
  p_user_id: string
  p_role_id: string
  p_request_type_name?: string
  p_include_items?: boolean
}

// Get Supply Request History RPC Types  
export interface GetSupplyRequestHistoryRPCArgs {
  p_user_id: string
  p_filters: string // JSON string
}

export interface GetSupplyRequestHistoryRPCResult {
  success: boolean
  message?: string
  data: SupplyRequestWithItems[]
  total_count: number
  total_pages: number
  current_page: number
  page_size: number
}

// Process Request Approval with Items RPC Types
export interface ProcessRequestApprovalWithItemsRPCArgs {
  p_request_id: string
  p_step_id: string
  p_approver_id: string
  p_approval_status: string
  p_comments: string
  p_new_status: string
  p_new_step_id: string | null
  p_updated_items?: UpdatedRequestItem[] // Properly typed items array instead of raw JSON
}

export interface ProcessRequestApprovalWithItemsRPCResult {
  success: boolean
  new_status: string
  message: string
}

// Enhanced Approval Action with Items Update
export interface ApprovalActionWithItems extends ApprovalAction {
  updatedItems?: UpdatedRequestItem[]
}

// Updated Request Item for approval process
export interface UpdatedRequestItem {
  id: string // Required for identifying which item to update
  item_name?: string // Maps to database field
  description?: string // Maps to database field  
  quantity?: number
  unit?: string
}
