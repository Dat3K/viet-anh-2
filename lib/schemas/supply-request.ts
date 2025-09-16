import { z } from 'zod'
import { shortText, mediumText, longText, positiveNumber, requiredSelect, futureDate } from './common'

// Supply request priority levels
export const supplyRequestPriority = z.enum(['low', 'medium', 'high', 'urgent'], {
  message: 'Vui lòng chọn mức độ ưu tiên'
})

// Supply request categories
export const supplyRequestCategory = z.enum([
  'stationery', // Văn phòng phẩm
  'teaching_materials', // Thiết bị giảng dạy
  'technology', // Công nghệ thông tin
  'furniture', // Nội thất
  'maintenance', // Bảo trì
  'cleaning', // Vệ sinh
  'other' // Khác
], {
  message: 'Vui lòng chọn danh mục yêu cầu'
})

// Supply request item schema
export const supplyRequestItemSchema = z.object({
  name: shortText.refine(val => val.length >= 2, {
    message: 'Tên vật tư phải có ít nhất 2 ký tự'
  }),
  description: mediumText.optional(),
  quantity: positiveNumber.refine(val => val <= 1000, {
    message: 'Số lượng không được vượt quá 1000'
  }),
  unit: shortText.refine(val => val.length >= 1, {
    message: 'Vui lòng nhập đơn vị tính'
  }),
  estimatedPrice: positiveNumber.optional(),
  specifications: mediumText.optional(),
})

// Main supply request form schema
export const createSupplyRequestSchema = z.object({
  title: shortText.refine(val => val.length >= 5, {
    message: 'Tiêu đề phải có ít nhất 5 ký tự'
  }),
  
  description: longText.refine(val => val.length >= 10, {
    message: 'Mô tả phải có ít nhất 10 ký tự'
  }),
  
  category: supplyRequestCategory,
  
  priority: supplyRequestPriority,
  
  department: requiredSelect,
  
  requestedBy: shortText,
  
  requestedDate: futureDate.refine(val => {
    const requestDate = new Date(val)
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1) // Max 1 year in future
    return requestDate <= maxDate
  }, {
    message: 'Ngày yêu cầu không được quá 1 năm'
  }),
  
  justification: longText.refine(val => val.length >= 20, {
    message: 'Lý do yêu cầu phải có ít nhất 20 ký tự'
  }),
  
  items: z.array(supplyRequestItemSchema).min(1, {
    message: 'Phải có ít nhất 1 vật tư trong yêu cầu'
  }).max(20, {
    message: 'Không được vượt quá 20 vật tư trong một yêu cầu'
  }),
  
  budgetLimit: positiveNumber.optional(),
  
  notes: mediumText.optional(),
  
  attachments: z.array(z.string()).optional(), // File URLs
})

// Type exports
export type CreateSupplyRequestData = z.infer<typeof createSupplyRequestSchema>
export type SupplyRequestItemData = z.infer<typeof supplyRequestItemSchema>
export type SupplyRequestPriority = z.infer<typeof supplyRequestPriority>
export type SupplyRequestCategory = z.infer<typeof supplyRequestCategory>

// Category labels for UI
export const categoryLabels: Record<SupplyRequestCategory, string> = {
  stationery: 'Văn phòng phẩm',
  teaching_materials: 'Thiết bị giảng dạy',
  technology: 'Công nghệ thông tin',
  furniture: 'Nội thất',
  maintenance: 'Bảo trì',
  cleaning: 'Vệ sinh',
  other: 'Khác'
}

// Priority labels for UI
export const priorityLabels: Record<SupplyRequestPriority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp'
}

// Priority colors for UI
export const priorityColors: Record<SupplyRequestPriority, string> = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  urgent: 'text-red-600 bg-red-50 border-red-200'
}

// Department options (can be moved to a separate config file later)
export const departmentOptions = [
  { value: 'elementary', label: 'Tiểu học' },
  { value: 'middle_school', label: 'Trung học cơ sở' },
  { value: 'high_school', label: 'Trung học phổ thông' },
  { value: 'administration', label: 'Hành chính' },
  { value: 'it_department', label: 'Phòng IT' },
  { value: 'library', label: 'Thư viện' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'security', label: 'Bảo vệ' },
]
