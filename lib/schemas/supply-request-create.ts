import { z } from 'zod'

export const createSupplyRequestSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  purpose: z.string().min(1, 'Mục đích không được để trống'),
  requestedDate: z.string().min(1, 'Ngày cần có không được để trống'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    message: 'Vui lòng chọn mức độ ưu tiên'
  }),
  requestType: z.literal('supply_request'),
  items: z.array(z.object({
    name: z.string().min(1, 'Tên vật tư không được để trống'),
    quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
    unit: z.string().min(1, 'Đơn vị tính không được để trống'),
    notes: z.string().optional()
  })).min(1, 'Phải có ít nhất 1 vật tư')
})

// Priority options for the form
export const priorityOptions = [
  { value: 'low', label: 'Thấp', color: 'text-green-600' },
  { value: 'medium', label: 'Trung bình', color: 'text-yellow-600' },
  { value: 'high', label: 'Cao', color: 'text-orange-600' },
  { value: 'urgent', label: 'Khẩn cấp', color: 'text-red-600' }
]

// Type export
export type CreateSupplyRequestData = z.infer<typeof createSupplyRequestSchema>
