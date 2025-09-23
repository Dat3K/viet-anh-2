import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  FileText,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useApprovedRequestDetail } from '@/hooks/useApprovedRequestDetail'
import { Skeleton } from '@/components/ui/skeleton'

// For testing purposes, we'll use a hardcoded request ID
// In a real application, this would come from URL params or props
const TEST_REQUEST_ID = '1'

interface ApprovedRequestDetailProps {
 className?: string
 requestId?: string
}

export function ApprovedRequestDetail({ className, requestId = TEST_REQUEST_ID }: ApprovedRequestDetailProps) {
  const { request, approvalHistory, isLoading, isError } = useApprovedRequestDetail(requestId)

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        {/* Request Header Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-8 w-64" />
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Skeleton className="h-6 w-24" />
                  <Separator orientation="vertical" className="h-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Items Section Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-8" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="hover:bg-muted/20 transition-colors">
                  <CardContent className="pt-4">
                    <div className="grid gap-2 md:grid-cols-3">
                      {[...Array(3)].map((_, idx) => (
                        <div key={idx}>
                          <Skeleton className="h-3 w-24 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Approval History Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1">
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    
                    <Skeleton className="h-4 w-64 mt-1" />
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  
                  <div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !request) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Có lỗi xảy ra khi tải chi tiết yêu cầu
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Extract data from request and approval history
  const requestNumber = request.request_number || 'N/A'
  const title = request.title || 'N/A'
  const status = request.status as any
  const priority = request.priority as any
  const createdAt = request.created_at ? new Date(request.created_at) : new Date()
  // Note: We don't have requester details in the current data structure
  const requester = 'N/A'
  const department = 'N/A'
  const purpose = typeof request.payload === 'object' && request.payload !== null ?
    (request.payload as any).purpose || 'N/A' : 'N/A'
  const requestedDate = typeof request.payload === 'object' && request.payload !== null ?
    (request.payload as any).requestedDate || 'N/A' : 'N/A'
  const items = request.items || []
  
  // For approvedAt, we'll use the latest approval date
  const approvedAt = approvalHistory && approvalHistory.length > 0 ?
    new Date(approvalHistory[approvalHistory.length - 1].approved_at || '') : new Date()

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Request Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  {title}
                </CardTitle>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">
                  {requestNumber}
                </Badge>
                {requester !== 'N/A' && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-muted-foreground">
                      Yêu cầu từ {requester}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
                <PriorityBadge priority={priority} />
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  <span>{items.length} vật tư</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(createdAt, 'dd/MM/yyyy', { locale: vi })}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mục đích sử dụng</label>
              <p className="mt-1 text-sm">{purpose}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ngày cần sử dụng</label>
              <p className="mt-1 text-sm">
                {requestedDate}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phòng ban</label>
              <p className="mt-1 text-sm">{department !== 'N/A' ? department : 'Không xác định'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ngày xử lý</label>
              <p className="mt-1 text-sm">
                {approvalHistory && approvalHistory.length > 0 ?
                  format(approvedAt, 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Danh sách vật tư
            <Badge variant="outline">{items.length}</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:bg-muted/20 transition-colors">
                <CardContent className="pt-4">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Tên vật tư</label>
                      <p className="font-medium">{item.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs text-muted-foreground">Số lượng</label>
                      <p className="font-medium">{item.quantity} {item.unit}</p>
                    </div>
                    
                    {item.notes && (
                      <div>
                        <label className="text-xs text-muted-foreground">Ghi chú</label>
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approval History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lịch sử phê duyệt
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {approvalHistory?.map((approval) => (
              <div key={approval.id} className="flex items-start gap-4">
                <div className="mt-1">
                  {approval.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">N/A</span>
                    <Badge variant="outline" className="text-xs">
                      N/A
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {approval.comments || 'Không có nhận xét'}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {approval.approved_at ?
                        format(new Date(approval.approved_at), 'dd/MM/yyyy HH:mm', { locale: vi }) :
                        'N/A'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <StatusBadge status={approval.status as any} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}