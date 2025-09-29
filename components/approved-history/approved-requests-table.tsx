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
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatusBadge, type StatusType } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { ApprovalHistoryEntry, Priority } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'

interface ApprovedRequestsTableProps {
  className?: string
  requests?: ApprovalHistoryEntry[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onView?: (id: string) => void
}

export function ApprovedRequestsTable({
  className,
  requests = [],
  isLoading = false,
  isError = false,
  onRetry,
  onView
}: ApprovedRequestsTableProps) {
  // Memoize the requests data to prevent unnecessary re-renders
  const memoizedRequests = useMemo(() => {
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
                  <TableHead>Trạng thái duyệt</TableHead>
                  <TableHead>Trạng thái yêu cầu</TableHead>
                  <TableHead>Mức độ ưu tiên</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
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
                <TableHead>Trạng thái duyệt</TableHead>
                <TableHead>Trạng thái yêu cầu</TableHead>
                <TableHead>Mức độ ưu tiên</TableHead>
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
                
                return (
                  <TableRow key={approval.id}>
                    <TableCell className="font-mono text-sm">
                      {request?.request_number || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={approval.status as StatusType} />
                    </TableCell>
                    <TableCell>
                      {request?.status && <StatusBadge status={request.status as StatusType} />}
                    </TableCell>
                    <TableCell>
                      {request?.priority && <PriorityBadge priority={request.priority as Priority} />}
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
                      {request?.id ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-sm font-medium"
                          asChild
                        >
                          <Link href={`/supply-requests/${request.id}`}>
                            Xem
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-sm font-medium"
                          disabled
                        >
                          Xem
                        </Button>
                      )}
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