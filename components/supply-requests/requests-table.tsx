import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  Plus, 
  Eye,
  Edit,
  Trash2,
  Package,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { SupplyRequestWithItems } from '@/types/database'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'

interface RequestsTableProps {
  requests: SupplyRequestWithItems[]
  isLoading?: boolean
  onView: (requestId: string) => void
  onEdit: (requestId: string) => void
  onDelete: (requestId: string) => void
  onCreateNew: () => void
  isDeleting?: boolean
  className?: string
}

export function RequestsTable({
  requests,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onCreateNew,
  isDeleting = false,
  className
}: RequestsTableProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu (0)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có yêu cầu nào</h3>
            <p className="text-muted-foreground mb-4">
              Bạn chưa có yêu cầu vật tư nào
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo yêu cầu đầu tiên
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Danh sách yêu cầu ({requests.length})</CardTitle>
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
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">
                    {request.request_number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {request.title}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={request.priority} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.items?.length || 0} vật tư
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.created_at 
                      ? format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <RequestActions
                      request={request}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isDeleting={isDeleting}
                    />
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

// Separate component for request actions
interface RequestActionsProps {
  request: SupplyRequestWithItems
  onView: (requestId: string) => void
  onEdit: (requestId: string) => void
  onDelete: (requestId: string) => void
  isDeleting?: boolean
}

function RequestActions({
  request,
  onView,
  onEdit,
  onDelete,
  isDeleting = false
}: RequestActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {/* View button - always available */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onView(request.id)}
        title="Xem chi tiết"
      >
        <Eye className="h-4 w-4" />
      </Button>

      {/* Edit and Delete buttons - only for pending requests */}
      {request.status === 'pending' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(request.id)}
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(request.id)}
            disabled={isDeleting}
            title="Xóa"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </>
      )}
    </div>
  )
}

// Simple table without card wrapper
interface SimpleRequestsTableProps {
  requests: SupplyRequestWithItems[]
  onView: (requestId: string) => void
  onEdit: (requestId: string) => void
  onDelete: (requestId: string) => void
  isDeleting?: boolean
  className?: string
}

export function SimpleRequestsTable({
  requests,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  className
}: SimpleRequestsTableProps) {
  return (
    <div className={`rounded-md border ${className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã yêu cầu</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Mức độ ưu tiên</TableHead>
            <TableHead>Số lượng vật tư</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-mono text-sm">
                {request.request_number}
              </TableCell>
              <TableCell className="font-medium">
                {request.title}
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={request.priority} />
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {request.items?.length || 0} vật tư
                </Badge>
              </TableCell>
              <TableCell>
                {request.created_at 
                  ? format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                  : 'N/A'
                }
              </TableCell>
              <TableCell className="text-right">
                <RequestActions
                  request={request}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeleting={isDeleting}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
