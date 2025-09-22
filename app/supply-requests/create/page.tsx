'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormSection } from '@/components/form/form-section'
import { ProfileInfoCard } from '@/components/profile/profile-info-card'
import { SupplyItemCard } from '@/components/supply-request/supply-item-card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Plus,
  Package,
  FileText,
  CheckCircle2,
  Loader2,
  Copy,
  Send,
  RotateCcw
} from 'lucide-react'
import {
  createSupplyRequestSchema,
  type CreateSupplyRequestData,
  priorityOptions
} from '@/lib/schemas/supply-request-create'
import { useUserProfile } from '@/hooks/use-profile'
import { useCreateSupplyRequest } from '@/hooks/use-supply-requests'

import { toast } from 'sonner'

// Component that uses useSearchParams
function CreateSupplyRequestContent() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [showOptimisticFeedback, setShowOptimisticFeedback] = useState(false)
  const addButtonRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const { profile, isLoading: profileLoading } = useUserProfile()
  const createSupplyRequestMutation = useCreateSupplyRequest()

  // Check if this is a copy operation
  const isCopyOperation = searchParams.get('copy') === 'true'
  const sourceRequestId = searchParams.get('source')


  // Helper function để tạo date string từ Date object
  const getDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const form = useForm<CreateSupplyRequestData>({
    resolver: zodResolver(createSupplyRequestSchema),
    defaultValues: {
      title: 'Yêu cầu vật tư',
      purpose: '',
      requestedDate: getDateString(new Date()),
      priority: 'medium',
      requestType: 'supply_request',
      items: [
        {
          name: '',
          quantity: 1,
          unit: '',
          notes: ''
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  // Handle copy data loading
  useEffect(() => {
    if (isCopyOperation) {
      try {
        // Try to get data from sessionStorage first, then localStorage
        let copyDataString = sessionStorage.getItem('copyRequestData')
        if (!copyDataString) {
          copyDataString = localStorage.getItem('copyRequestData')
        }

        if (copyDataString) {
          const copyData = JSON.parse(copyDataString)
          console.log('Loading copy data:', copyData)

          // Populate form with copy data
          form.reset({
            title: copyData.title || 'Yêu cầu vật tư',
            purpose: copyData.purpose || '',
            requestedDate: copyData.requestedDate || getDateString(new Date()),
            priority: copyData.priority || 'medium',
            requestType: 'supply_request',
            items: copyData.items && copyData.items.length > 0 ? copyData.items : [{
              name: '',
              quantity: 1,
              unit: '',
              notes: ''
            }]
          })

          // Clean up storage after loading
          sessionStorage.removeItem('copyRequestData')
          localStorage.removeItem('copyRequestData')

          // Show success message
          toast.success('Đã tải dữ liệu bản sao', {
            description: `${copyData.items?.length || 0} vật tư đã được sao chép`,
            duration: 4000,
          })

          // Expand all items to show copied data
          const expandedItems: Record<string, boolean> = {}
          copyData.items?.forEach((_: CreateSupplyRequestData['items'][number], index: number) => {
            expandedItems[index.toString()] = true
          })
          setOpenItems(expandedItems)

        } else {
          toast.warning('Không tìm thấy dữ liệu sao chép', {
            description: 'Có thể dữ liệu đã hết hạn hoặc bị xóa',
            duration: 4000,
          })
        }
      } catch (error) {
        console.error('Error loading copy data:', error)
        toast.error('Lỗi khi tải dữ liệu sao chép', {
          description: 'Vui lòng thử tạo bản sao lại',
          duration: 5000,
        })
      }
    }
  }, [isCopyOperation, sourceRequestId, form])

  const onSubmit = async (data: CreateSupplyRequestData) => {
    try {
      // Show optimistic feedback immediately
      setShowOptimisticFeedback(true)

      // Validate form data before submission
      const validatedData = createSupplyRequestSchema.parse(data)

      // Prepare data for submission - compatible with service layer
      const submitData = {
        title: validatedData.title,
        purpose: validatedData.purpose,
        requestedDate: validatedData.requestedDate,
        priority: validatedData.priority,
        items: validatedData.items.filter(item => item.name.trim() !== '') // Remove empty items
      }

      // Validate that we have at least one item
      if (submitData.items.length === 0) {
        toast.error('Vui lòng thêm ít nhất một vật tư', {
          description: 'Yêu cầu phải có ít nhất một vật tư được điền đầy đủ thông tin'
        })
        return
      }

      console.log('Supply request data:', submitData)

      // Create the supply request with optimistic updates
      const result = await createSupplyRequestMutation.mutateAsync(submitData)

      // Success feedback
      toast.success('Đã gửi yêu cầu thành công!', {
        description: `Mã yêu cầu: ${result.request_number} • ${submitData.items.length} vật tư`,
        duration: 6000,
        action: {
          label: 'Xem danh sách',
          onClick: () => router.push('/supply-requests')
        }
      })

      // Reset form after successful submission
      form.reset({
        title: 'Yêu cầu vật tư',
        purpose: '',
        requestedDate: getDateString(new Date()),
        priority: 'medium',
        requestType: 'supply_request',
        items: [{
          name: '',
          quantity: 1,
          unit: '',
          notes: ''
        }]
      })

      // Clear any open item states
      setOpenItems({})

      // Navigate to requests list after successful submission
      setTimeout(() => {
        router.push('/supply-requests')
      }, 2000)

    } catch (error) {
      console.error('Error submitting supply request:', error)
      
      // Enhanced error handling with specific messages
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          toast.error('Dữ liệu không hợp lệ', {
            description: 'Vui lòng kiểm tra lại thông tin đã nhập',
            duration: 6000
          })
        } else if (error.message.includes('not authenticated')) {
          toast.error('Phiên đăng nhập hết hạn', {
            description: 'Vui lòng đăng nhập lại để tiếp tục',
            duration: 6000,
            action: {
              label: 'Đăng nhập',
              onClick: () => router.push('/auth/login')
            }
          })
        } else {
          toast.error('Không thể tạo yêu cầu', {
            description: error.message || 'Có lỗi xảy ra, vui lòng thử lại sau',
            duration: 6000
          })
        }
      } else {
        toast.error('Có lỗi xảy ra', {
          description: 'Vui lòng thử lại sau hoặc liên hệ quản trị viên',
          duration: 6000
        })
      }
    } finally {
      setShowOptimisticFeedback(false)
    }
  }

  const handleSubmit = () => {
    form.handleSubmit(onSubmit)()
  }

  const handleReset = () => {
    // Reset form to default values
    form.reset({
      title: 'Yêu cầu vật tư',
      purpose: '',
      requestedDate: getDateString(new Date()),
      priority: 'medium',
      requestType: 'supply_request',
      items: [{
        name: '',
        quantity: 1,
        unit: '',
        notes: ''
      }]
    })

    // Clear opened items state
    setOpenItems({})

    // Show confirmation toast
    toast.success('Đã reset form', {
      description: 'Tất cả dữ liệu đã được xóa và reset về mặc định',
      duration: 3000,
    })
  }



  const toggleItem = (itemId: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const addItem = () => {
    // Validate current items before adding new one
    const currentItems = form.getValues('items')
    const hasEmptyItems = currentItems.some(item => !item.name.trim())
    
    if (hasEmptyItems) {
      toast.warning('Vui lòng hoàn thành vật tư hiện tại', {
        description: 'Điền đầy đủ thông tin cho các vật tư đã thêm trước khi thêm mới',
        duration: 4000
      })
      return
    }

    append({
      name: '',
      quantity: 1,
      unit: '',
      notes: ''
    })

    // Auto-expand the new item
    setTimeout(() => {
      const newItemIndex = fields.length
      const newItemId = `item-${newItemIndex}`
      setOpenItems(prev => ({
        ...prev,
        [newItemId]: true
      }))
      
      // Scroll to bottom after adding new item
      addButtonRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      })
    }, 100)
  }

  // Dev-only quick fill function
  const quickFillForm = () => {
    if (process.env.NODE_ENV !== 'development') return

    const sampleData = {
      title: 'Yêu cầu vật tư lớp 10A - Học kỳ 1',
      purpose: 'Chuẩn bị vật tư giảng dạy cho môn Toán và Vật lý trong học kỳ 1. Các vật tư này sẽ được sử dụng cho các bài thực hành và thí nghiệm.',
      requestedDate: getDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
      priority: 'medium' as const,
      requestType: 'supply_request' as const,
      items: [
        {
          name: 'Bút viết bảng',
          quantity: 10,
          unit: 'cái',
          notes: 'Màu đen và xanh'
        },
        {
          name: 'Giấy A4',
          quantity: 5,
          unit: 'ream',
          notes: 'Giấy in chất lượng cao'
        },
        {
          name: 'Máy tính cầm tay',
          quantity: 3,
          unit: 'cái',
          notes: 'Casio FX-580VN Plus'
        }
      ]
    }

    form.reset(sampleData)
    toast.success('Đã điền dữ liệu mẫu!', {
      description: 'Form đã được điền với dữ liệu test'
    })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                {isCopyOperation ? <Copy className="h-8 w-8 text-orange-600" /> : <FileText className="h-8 w-8" />}
                {isCopyOperation ? 'Tạo bản sao yêu cầu vật tư' : 'Tạo yêu cầu vật tư mới'}
              </h1>
              <p className="text-muted-foreground">
                {isCopyOperation 
                  ? `Tạo yêu cầu mới từ bản sao${sourceRequestId ? ` (từ ${sourceRequestId.slice(0, 8)}...)` : ''}`
                  : 'Điền thông tin chi tiết để tạo yêu cầu vật tư và thiết bị giảng dạy'
                }
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Reset Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={createSupplyRequestMutation.isPending || showOptimisticFeedback}
                className="shrink-0 flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              
              {/* Dev-only Quick Fill Button */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={quickFillForm}
                  className="shrink-0 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-300"
                >
                  🚀 Điền nhanh (Dev)
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced loading and status feedback */}
          {(showOptimisticFeedback || createSupplyRequestMutation.isPending) && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Đang tạo yêu cầu vật tư...
              </span>
            </div>
          )}

          {/* Success feedback */}
          {createSupplyRequestMutation.isSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Yêu cầu đã được tạo thành công!
              </span>
            </div>
          )}

          {/* Enhanced error feedback */}
          {createSupplyRequestMutation.error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex-shrink-0 w-4 h-4 mt-0.5">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Không thể tạo yêu cầu
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {createSupplyRequestMutation.error instanceof Error
                    ? createSupplyRequestMutation.error.message
                    : 'Có lỗi xảy ra, vui lòng thử lại sau'}
                </p>
              </div>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormSection title="Thông tin chung" icon={FileText}>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề yêu cầu *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ví dụ: Yêu cầu mua bút viết cho lớp 10A"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mục đích *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mô tả mục đích sử dụng vật tư..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày cần có</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              // Sử dụng local timezone để tránh lệch ngày
                              const year = date.getFullYear()
                              const month = String(date.getMonth() + 1).padStart(2, '0')
                              const day = String(date.getDate()).padStart(2, '0')
                              field.onChange(`${year}-${month}-${day}`)
                            } else {
                              field.onChange('')
                            }
                          }}
                          placeholder="Chọn ngày cần có vật tư"
                          disablePastDates={true}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mức độ ưu tiên</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn mức độ ưu tiên" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={option.color}>
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestType"
                  render={() => (
                    <FormItem>
                      <FormLabel>Loại yêu cầu</FormLabel>
                      <FormControl>
                        <Input
                          value="Yêu cầu vật tư"
                          disabled
                          className="bg-muted"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </FormSection>

              <ProfileInfoCard
                profile={profile}
                isLoading={profileLoading}
              />
            </div>

            <FormSection title="Danh sách vật tư" icon={Package} contentClassName="space-y-6">
              {fields.map((field, index) => {
                const itemId = field.id
                const isOpen = openItems[itemId] ?? true

                return (
                  <SupplyItemCard
                    key={field.id}
                    field={field}
                    index={index}
                    control={form.control}
                    isOpen={isOpen}
                    onToggle={() => toggleItem(itemId)}
                    onRemove={() => removeItem(index)}
                    canRemove={fields.length > 1}
                  />
                )
              })}

              <div ref={addButtonRef} className="flex justify-center pt-4">
                <Button type="button" onClick={addItem} variant="outline" className="w-full max-w-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm vật tư
                </Button>
              </div>
            </FormSection>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createSupplyRequestMutation.isPending || showOptimisticFeedback || profileLoading || !profile}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {createSupplyRequestMutation.isPending || showOptimisticFeedback ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>

            {/* Form validation summary */}
            {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  Vui lòng kiểm tra lại thông tin:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  {Object.entries(form.formState.errors).map(([key, error]) => (
                    <li key={key} className="flex items-start gap-1">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{error?.message || `Lỗi ở trường ${key}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </Form>
      </div>
    </AppLayout>
  )
}

// Loading fallback component
function CreateSupplyRequestFallback() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Package className="h-6 w-6" />
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </h1>
              <p className="text-muted-foreground">
                Đang chuẩn bị form tạo yêu cầu vật tư
              </p>
            </div>

            {/* Loading skeleton */}
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded-lg animate-pulse" />
              <div className="h-48 bg-muted rounded-lg animate-pulse" />
              <div className="h-64 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// Main export component with Suspense boundary
export default function CreateSupplyRequestPage() {
  return (
    <Suspense fallback={<CreateSupplyRequestFallback />}>
      <CreateSupplyRequestContent />
    </Suspense>
  )
}
