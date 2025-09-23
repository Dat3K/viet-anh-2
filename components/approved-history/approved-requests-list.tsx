import React, { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { StatusBadge, type StatusType } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { RequestApprovalWithDetails } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'
import type { Priority } from '@/types/database'

interface ApprovedRequestsListProps {
  className?: string
  requests?: RequestApprovalWithDetails[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

export function ApprovedRequestsList({
  className,
  requests = [],
  isLoading = false,
  isError = false,
  onRetry
}: ApprovedRequestsListProps) {
  // Memoize the requests data to prevent unnecessary re-renders
  const memoizedRequests = useMemo(() => {
    console.log('Recomputing memoized requests, count:', requests.length)
    return requests
  }, [requests])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu đã xử lý</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã yêu cầu</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Mức độ ưu tiên</TableHead>
                  <TableHead>Số lượng vật tư</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Ngày xử lý</TableHead>
                  <TableHead>Người xử lý</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu đã xử lý</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Có lỗi xảy ra khi tải dữ liệu
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Thử lại
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!memoizedRequests || memoizedRequests.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu đã xử lý</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-8 text-center">
            <p className="text-muted-foreground">
              Không có yêu cầu nào đã xử lý
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Danh sách yêu cầu đã xử lý</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã yêu cầu</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Mức độ ưu tiên</TableHead>
                <TableHead>Số lượng vật tư</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Ngày xử lý</TableHead>
                <TableHead>Người xử lý</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memoizedRequests.map((approval) => {
                const request = approval.request
                const approver = approval.approver
                // Note: We don't have item count directly in the approval data
                // This will be updated when we integrate with the detail view
                const itemCount = 0
                
                return (
                  <TableRow key={approval.id}>
                    <TableCell className="font-mono text-sm">
                      {request?.request_number || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {request?.status && <StatusBadge status={request.status as StatusType} />}
                    </TableCell>
                    <TableCell>
                      {request?.priority && <PriorityBadge priority={request.priority as Priority} />}
                    </TableCell>
                    <TableCell>
                      {itemCount > 0 ? `${itemCount} vật tư` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {request?.created_at ?
                        format(new Date(request.created_at), 'dd/MM/yyyy', { locale: vi }) :
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {approval.approved_at ?
                        format(new Date(approval.approved_at), 'dd/MM/yyyy', { locale: vi }) :
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {approver?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}