'use client'

import { useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { ActionButtons } from '@/components/form/action-buttons'
import { 
  Plus, 
  Package, 
  FileText
} from 'lucide-react'
import { 
  createSupplyRequestSchema, 
  type CreateSupplyRequestData, 
  priorityOptions 
} from '@/lib/schemas/supply-request-create'
import { useUserProfile } from '@/hooks/use-profile'

export default function CreateSupplyRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMode, setSubmitMode] = useState<'draft' | 'submit'>('draft')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const addButtonRef = useRef<HTMLDivElement>(null)
  
  const { profile, isLoading: profileLoading } = useUserProfile()

  const form = useForm<CreateSupplyRequestData>({
    resolver: zodResolver(createSupplyRequestSchema),
    defaultValues: {
      title: '',
      purpose: '',
      requestedDate: new Date().toISOString().split('T')[0], 
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

  const onSubmit = async (data: CreateSupplyRequestData) => {
    setIsSubmitting(true)
    try {
      console.log('Supply request data:', data)
      console.log('Submit mode:', submitMode)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert(submitMode === 'draft' ? 'Đã lưu nháp thành công!' : 'Đã gửi yêu cầu thành công!')
    } catch (error) {
      console.error('Error submitting supply request:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (mode: 'draft' | 'submit') => {
    setSubmitMode(mode)
    const submitHandler = (data: CreateSupplyRequestData) => onSubmit(data)
    form.handleSubmit(submitHandler)()
  }

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const addItem = () => {
    append({
      name: '',
      quantity: 1,
      unit: '',
      notes: ''
    })
    
    // Scroll to bottom after adding new item
    setTimeout(() => {
      addButtonRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      })
    }, 100)
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tạo yêu cầu vật tư mới</h1>
            <p className="text-muted-foreground">
              Điền thông tin chi tiết để tạo yêu cầu vật tư và thiết bị giảng dạy
            </p>
          </div>
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
                        <Input type="date" {...field} />
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
                  render={({ field }) => (
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

            <ActionButtons
              isSubmitting={isSubmitting}
              submitMode={submitMode}
              onSaveDraft={() => handleSubmit('draft')}
              onSubmit={() => handleSubmit('submit')}
            />
          </form>
        </Form>
      </div>
    </AppLayout>
  )
}
