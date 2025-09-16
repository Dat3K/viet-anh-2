'use client'

import { useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Package, 
  FileText,
  User,
  ChevronDown,
  ChevronUp
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Thông tin chung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin người yêu cầu
                    {profileLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile ? (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Họ và tên</span>
                          <span className="text-sm">{profile.full_name || 'Chưa cập nhật'}</span>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Email</span>
                          <span className="text-sm">{profile.email || 'Chưa cập nhật'}</span>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Số điện thoại</span>
                          <span className="text-sm">{profile.phone || 'Chưa cập nhật'}</span>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Mã nhân viên</span>
                          <span className="text-sm">{profile.employee_code || 'Chưa cập nhật'}</span>
                        </div>
                        
                        {profile.role && (
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Chức vụ</span>
                            <span className="text-sm">{profile.role.name}</span>
                          </div>
                        )}
                        
                        {profile.department && (
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Bộ phận</span>
                            <span className="text-sm">{profile.department.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    !profileLoading && (
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <p className="text-sm text-muted-foreground">
                          Không tìm thấy thông tin người dùng. Vui lòng kiểm tra lại hồ sơ cá nhân.
                        </p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Danh sách vật tư
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => {
                  const itemId = field.id
                  const isOpen = openItems[itemId] ?? true
                  const isEven = index % 2 === 0
                  
                  return (
                    <div 
                      key={field.id} 
                      className={`border rounded-lg transition-colors ${
                        isEven 
                          ? 'bg-muted/20 hover:bg-muted/30' 
                          : 'bg-blue-50/50 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30'
                      }`}
                    >
                      <Collapsible open={isOpen} onOpenChange={() => toggleItem(itemId)}>
                        <CollapsibleTrigger asChild>
                          <div className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                            isEven 
                              ? 'hover:bg-muted/40' 
                              : 'hover:bg-blue-100/60 dark:hover:bg-blue-900/40'
                          }`}>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">Vật tư #{index + 1}</h4>
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeItem(index)
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tên vật tư *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ví dụ: Bút bi xanh" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Số lượng *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="1"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.unit`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Đơn vị tính *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ví dụ: cái, hộp, kg" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-3">
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Ghi chú thêm về vật tư này..."
                                        className="min-h-[60px]"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )
                })}

                <div ref={addButtonRef} className="flex justify-center pt-4">
                  <Button type="button" onClick={addItem} variant="outline" className="w-full max-w-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm vật tư
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                className="sm:order-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting && submitMode === 'draft' ? 'Đang lưu...' : 'Lưu nháp'}
              </Button>
              
              <Button
                type="button"
                onClick={() => handleSubmit('submit')}
                disabled={isSubmitting}
                className="sm:order-2"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting && submitMode === 'submit' ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  )
}
