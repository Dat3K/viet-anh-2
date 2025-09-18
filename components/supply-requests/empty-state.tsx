import { Button } from '@/components/ui/button'
import { Package, Plus, Search } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-requests' | 'no-filtered-results'
  onCreateNew: () => void
  onResetFilters?: () => void
  className?: string
}

export function EmptyState({ 
  type, 
  onCreateNew, 
  onResetFilters, 
  className 
}: EmptyStateProps) {
  if (type === 'no-filtered-results') {
    return (
      <div className={`text-center py-8 ${className || ''}`}>
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Không tìm thấy kết quả</h3>
        <p className="text-muted-foreground mb-4">
          Không có yêu cầu nào phù hợp với bộ lọc hiện tại
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {onResetFilters && (
            <Button variant="outline" onClick={onResetFilters}>
              Xóa bộ lọc
            </Button>
          )}
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo yêu cầu mới
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`text-center py-8 ${className || ''}`}>
      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Chưa có yêu cầu nào</h3>
      <p className="text-muted-foreground mb-4">
        Bạn chưa tạo yêu cầu vật tư nào. Hãy tạo yêu cầu đầu tiên của bạn.
      </p>
      <Button onClick={onCreateNew}>
        <Plus className="h-4 w-4 mr-2" />
        Tạo yêu cầu đầu tiên
      </Button>
    </div>
  )
}
