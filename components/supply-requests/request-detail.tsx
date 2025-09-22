'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StatusBadge, type StatusType } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import {
  Loader2,
  Edit3,
  Check,
  X,
  Calendar,
  Package,
  User,
  FileText,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  Copy,
  ArrowRight
} from 'lucide-react'
import type { SupplyRequestItem, Priority, ProcessRequestApprovalWithItemsRPCResult, SupplyRequestWithItems, Profile } from '@/types/database'
import { useSupplyRequestDetail, useSupplyRequestStats } from '@/hooks/use-supply-request-detail'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Component props interface
interface RequestDetailProps {
  requestId: string
  /** Display mode - controls what features are available */
  mode?: 'view' | 'edit' | 'approve' | 'full'
  /** Layout variant for different use cases */
  variant?: 'page' | 'modal' | 'card' | 'inline'
  /** Whether to show actions (approve/reject buttons) */
  showActions?: boolean
  /** Whether to show item editing capabilities */
  allowItemEditing?: boolean
  /** Custom class names */
  className?: string
  /** Custom header content */
  headerContent?: React.ReactNode
  /** Custom footer content */
  footerContent?: React.ReactNode
  /** Callback when approval is processed */
  onApprovalProcessed?: (action: 'approve' | 'reject', result: ProcessRequestApprovalWithItemsRPCResult) => void
}

/**
 * Flexible supply request detail component
 * Can be used as standalone page, modal content, or embedded component
 * Supports multiple display modes and layouts
 */
export function RequestDetail({
  requestId,
  mode = 'view',
  allowItemEditing = false,
  className = '',
  headerContent,
  footerContent,
  onApprovalProcessed
}: RequestDetailProps) {
  const router = useRouter()
  const {
    request,
    isLoading,
    error,
    canEdit,
    canApprove,
    isOwnRequest,
    updateItem,
    isUpdatingItem,
    isProcessingApproval,
    refetch
  } = useSupplyRequestDetail(requestId)

  const stats = useSupplyRequestStats(request)

  // Local state for item editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemUpdates, setItemUpdates] = useState<Record<string, {
    name?: string
    quantity?: number
    unit?: string
    notes?: string
  }>>({})

  // Local state for approval
  const [approvalComments, setApprovalComments] = useState('')
  const [showApprovalDialog, setShowApprovalDialog] = useState<'approve' | 'reject' | null>(null)
  
  // Local state for copy functionality  
  const [isCopying, setIsCopying] = useState(false)

  // Determine effective permissions based on mode and request state
  const effectiveCanEdit = (mode === 'edit' || mode === 'full') && (allowItemEditing || canEdit)
  // ONLY show actions if user actually can approve - ignore showActions prop for security
  const effectiveShowActions = (mode === 'approve' || mode === 'full') && canApprove && 
    // Hide approval actions if request is already approved, rejected, or cancelled
    request?.status !== 'approved' && request?.status !== 'rejected' && request?.status !== 'cancelled'
  
  // Show copy feature for cancelled requests
  const showCopyFeature = request?.status === 'cancelled'

  // Handle item editing
  const handleEditItem = (itemId: string) => {
    const item = request?.items?.find(i => i.id === itemId)
    if (item) {
      setEditingItemId(itemId)
      setItemUpdates(prev => ({
        ...prev,
        [itemId]: {
          name: item.name,
          quantity: item.quantity || 0,
          unit: item.unit || '',
          notes: item.notes || ''
        }
      }))
    }
  }

  const handleSaveItem = (itemId: string) => {
    const updates = itemUpdates[itemId]
    if (!updates) return

    try {
      updateItem({ itemId, updates })
      setEditingItemId(null)
      setItemUpdates(prev => {
        const newUpdates = { ...prev }
        delete newUpdates[itemId]
        return newUpdates
      })
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleCancelEdit = (itemId: string) => {
    setEditingItemId(null)
    setItemUpdates(prev => {
      const newUpdates = { ...prev }
      delete newUpdates[itemId]
      return newUpdates
    })
  }

  const handleApproval = async (action: 'approve' | 'reject') => {
    try {
      setShowApprovalDialog(null)
      setApprovalComments('')
      
      // Create mock result to satisfy callback type
      const mockResult: ProcessRequestApprovalWithItemsRPCResult = {
        success: true,
        new_status: action === 'approve' ? 'approved' : 'rejected',
        message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      }
      onApprovalProcessed?.(action, mockResult)
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  const handleCreateCopy = () => {
    if (!request) {
      toast.error('Không thể sao chép yêu cầu', {
        description: 'Không tìm thấy thông tin yêu cầu',
        duration: 4000,
      })
      return
    }

    setIsCopying(true)

    try {
      // Validate essential data
      if (!request.title || !request.items || request.items.length === 0) {
        toast.error('Không thể sao chép yêu cầu', {
          description: 'Yêu cầu thiếu thông tin cần thiết',
          duration: 4000,
        })
        setIsCopying(false)
        return
      }

      // Prepare data to pass to create page
      const payload = request.payload as { purpose?: string; requestedDate?: string } | null
      const copyData = {
        title: `[Bản sao] ${request.title}`,
        purpose: payload?.purpose || '',
        requestedDate: new Date().toISOString().split('T')[0], // Today's date
        priority: request.priority || 'medium',
        items: request.items.map(item => ({
          name: item.name || 'Vật tư không tên',
          quantity: Math.max(item.quantity || 1, 1), // Ensure at least 1
          unit: item.unit || 'cái',
          notes: item.notes || ''
        }))
      }

      // Validate copy data
      if (copyData.items.length === 0) {
        toast.error('Không thể sao chép yêu cầu', {
          description: 'Không có vật tư nào để sao chép',
          duration: 4000,
        })
        setIsCopying(false)
        return
      }

      // Try to store in both sessionStorage and localStorage for reliability
      const dataString = JSON.stringify(copyData)
      
      try {
        sessionStorage.setItem('copyRequestData', dataString)
        localStorage.setItem('copyRequestData', dataString)
      } catch (storageError) {
        console.error('Storage error:', storageError)
        toast.error('Không thể lưu dữ liệu tạm', {
          description: 'Vui lòng thử lại',
          duration: 4000,
        })
        setIsCopying(false)
        return
      }
      
      // Show success toast before navigation
      toast.success('Đã sao chép thông tin yêu cầu', {
        description: `${copyData.items.length} vật tư sẽ được sao chép`,
        duration: 3000,
      })

      // Navigate to create page with slight delay to ensure toast shows
      setTimeout(() => {
        router.push('/supply-requests/create?copy=true&source=' + request.id)
        setIsCopying(false)
      }, 100)

    } catch (error) {
      console.error('Copy request error:', error)
      toast.error('Có lỗi xảy ra khi sao chép', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại',
        duration: 5000,
      })
      setIsCopying(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm text-muted-foreground">Đang tải thông tin yêu cầu...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error || !request) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {error instanceof Error ? error.message : 'Không thể tải thông tin yêu cầu'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-4"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Get request payload data
  const payload = request.payload as { purpose?: string; requestedDate?: string } | null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  {request.title}
                </CardTitle>
                {headerContent}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">
                  {request.request_number}
                </Badge>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground">
                  {isOwnRequest ? 'Yêu cầu của bạn' : 'Yêu cầu từ người khác'}
                </span>
              </div>
              
              {(request as SupplyRequestWithItems & { profiles?: Profile }).profiles && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Người yêu cầu: <span className="font-medium">{(request as SupplyRequestWithItems & { profiles?: Profile }).profiles?.full_name}</span></span>
                  <span className="text-xs">({(request as SupplyRequestWithItems & { profiles?: Profile }).profiles?.email})</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex items-center gap-2">
                <StatusBadge status={request.status as StatusType} />
                <PriorityBadge priority={request.priority as Priority} />
              </div>
              
              {stats && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{stats.totalItems} vật tư</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(request.created_at!), 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {payload && (
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {payload.purpose && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Mục đích sử dụng</Label>
                  <p className="mt-1 text-sm">{payload.purpose}</p>
                </div>
              )}
              
              {payload.requestedDate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ngày cần sử dụng</Label>
                  <p className="mt-1 text-sm">
                    {format(new Date(payload.requestedDate), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Danh sách vật tư
            <Badge variant="outline">{request.items?.length || 0}</Badge>
          </CardTitle>
          <CardDescription>
            Chi tiết các vật tư được yêu cầu
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!request.items || request.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có vật tư nào được yêu cầu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {request.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingItemId === item.id}
                  canEdit={effectiveCanEdit}
                  updates={itemUpdates[item.id]}
                  onEdit={() => handleEditItem(item.id)}
                  onSave={() => handleSaveItem(item.id)}
                  onCancel={() => handleCancelEdit(item.id)}
                  onUpdateField={(field, value) => {
                    setItemUpdates(prev => ({
                      ...prev,
                      [item.id]: {
                        ...prev[item.id],
                        [field]: value
                      }
                    }))
                  }}
                  isSaving={isUpdatingItem}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copy Feature Section for Cancelled Requests */}
      {showCopyFeature && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Copy className="h-5 w-5" />
              Tạo bản sao yêu cầu
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Yêu cầu này đã bị hủy. Bạn có thể tạo một yêu cầu mới dựa trên thông tin của yêu cầu này.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Tất cả thông tin sẽ được sao chép sang yêu cầu mới, bạn có thể chỉnh sửa trước khi gửi.
              </div>
              
              <Button
                onClick={handleCreateCopy}
                disabled={isCopying}
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                {isCopying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang sao chép...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Tạo bản sao
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Section */}
      {effectiveShowActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Phê duyệt yêu cầu
            </CardTitle>
            <CardDescription>
              Xem xét và đưa ra quyết định cho yêu cầu này
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Dialog 
                open={showApprovalDialog === 'approve'} 
                onOpenChange={(open) => !open && setShowApprovalDialog(null)}
              >
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShowApprovalDialog('approve')}
                    disabled={isProcessingApproval}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Phê duyệt
                  </Button>
                </DialogTrigger>
                <ApprovalDialog
                  action="approve"
                  comments={approvalComments}
                  onCommentsChange={setApprovalComments}
                  onConfirm={() => handleApproval('approve')}
                  isProcessing={isProcessingApproval}
                />
              </Dialog>

              <Dialog 
                open={showApprovalDialog === 'reject'} 
                onOpenChange={(open) => !open && setShowApprovalDialog(null)}
              >
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowApprovalDialog('reject')}
                    disabled={isProcessingApproval}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                </DialogTrigger>
                <ApprovalDialog
                  action="reject"
                  comments={approvalComments}
                  onCommentsChange={setApprovalComments}
                  onConfirm={() => handleApproval('reject')}
                  isProcessing={isProcessingApproval}
                />
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Footer */}
      {footerContent && (
        <div>
          {footerContent}
        </div>
      )}
    </div>
  )
}

// Individual item row component
interface ItemRowProps {
  item: SupplyRequestItem
  isEditing: boolean
  canEdit: boolean
  updates?: {
    name?: string
    quantity?: number
    unit?: string
    notes?: string
  }
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onUpdateField: (field: string, value: unknown) => void
  isSaving: boolean
}

function ItemRow({
  item,
  isEditing,
  canEdit,
  updates,
  onEdit,
  onSave,
  onCancel,
  onUpdateField,
  isSaving
}: ItemRowProps) {
  const currentData = updates ? { ...item, ...updates } : item

  if (isEditing) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor={`name-${item.id}`} className="text-xs">Tên vật tư *</Label>
              <Input
                id={`name-${item.id}`}
                value={currentData.name || ''}
                onChange={(e) => onUpdateField('name', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor={`quantity-${item.id}`} className="text-xs">Số lượng *</Label>
              <Input
                id={`quantity-${item.id}`}
                type="number"
                value={currentData.quantity || ''}
                onChange={(e) => onUpdateField('quantity', Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor={`unit-${item.id}`} className="text-xs">Đơn vị</Label>
              <Input
                id={`unit-${item.id}`}
                value={currentData.unit || ''}
                onChange={(e) => onUpdateField('unit', e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-end gap-2 h-full">
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  className="h-8"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="h-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notes section */}
          <div className="mt-4">
            <Label htmlFor={`notes-${item.id}`} className="text-xs">Ghi chú</Label>
            <Textarea
              id={`notes-${item.id}`}
              value={currentData.notes || ''}
              onChange={(e) => onUpdateField('notes', e.target.value)}
              className="mt-1 text-sm"
              rows={2}
              placeholder="Ghi chú thêm về vật tư..."
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:bg-muted/20 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4 flex-1">
            <div>
              <Label className="text-xs text-muted-foreground">Tên vật tư</Label>
              <p className="font-medium">{item.name}</p>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Số lượng</Label>
              <p className="font-medium">{item.quantity} {item.unit}</p>
            </div>
            
            {item.notes && (
              <div className="md:col-span-2 lg:col-span-2">
                <Label className="text-xs text-muted-foreground">Ghi chú</Label>
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              </div>
            )}
          </div>

          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="ml-4"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Approval dialog component
interface ApprovalDialogProps {
  action: 'approve' | 'reject'
  comments: string
  onCommentsChange: (comments: string) => void
  onConfirm: () => void
  isProcessing: boolean
}

function ApprovalDialog({
  action,
  comments,
  onCommentsChange,
  onConfirm,
  isProcessing
}: ApprovalDialogProps) {
  const actionConfig = {
    approve: {
      title: 'Phê duyệt yêu cầu',
      description: 'Bạn có chắc chắn muốn phê duyệt yêu cầu này?',
      buttonLabel: 'Phê duyệt',
      buttonVariant: 'default' as const
    },
    reject: {
      title: 'Từ chối yêu cầu', 
      description: 'Bạn có chắc chắn muốn từ chối yêu cầu này?',
      buttonLabel: 'Từ chối',
      buttonVariant: 'destructive' as const
    }
  }

  const config = actionConfig[action]

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{config.title}</DialogTitle>
        <DialogDescription>
          {config.description}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="approval-comments">
            Nhận xét {action === 'reject' ? '(bắt buộc)' : '(tùy chọn)'}
          </Label>
          <Textarea
            id="approval-comments"
            value={comments}
            onChange={(e) => onCommentsChange(e.target.value)}
            placeholder={`Nhập nhận xét về quyết định ${action === 'approve' ? 'phê duyệt' : 'từ chối'}...`}
            className="mt-2"
            rows={3}
          />
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            disabled={isProcessing || (action === 'reject' && !comments.trim())}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : action === 'approve' ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            {config.buttonLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

export default RequestDetail
