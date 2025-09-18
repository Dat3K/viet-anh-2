import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Search, RefreshCw, Loader2 } from 'lucide-react'
import { StatusType } from '@/components/ui/status-badge'
import { PriorityType } from '@/components/ui/priority-badge'

export type StatusFilter = StatusType | 'all'
export type PriorityFilter = PriorityType | 'all'

interface Filters {
  search: string
  status: StatusFilter
  priority: PriorityFilter
}

interface FiltersSectionProps {
  filters: Filters
  onUpdateFilter: (key: keyof Filters, value: string) => void
  onResetFilters: () => void
  isLoading?: boolean
  className?: string
}

export function FiltersSection({
  filters,
  onUpdateFilter,
  onResetFilters,
  isLoading = false,
  className
}: FiltersSectionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Bộ lọc</CardTitle>
        <CardDescription>
          Tìm kiếm và lọc yêu cầu vật tư
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề hoặc mã yêu cầu..."
                value={filters.search}
                onChange={(e) => onUpdateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select 
            value={filters.status} 
            onValueChange={(value: StatusFilter) => onUpdateFilter('status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="in_progress">Đang xử lý</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select 
            value={filters.priority} 
            onValueChange={(value: PriorityFilter) => onUpdateFilter('priority', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mức độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả mức độ</SelectItem>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
              <SelectItem value="urgent">Khẩn cấp</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Button */}
          <Button 
            variant="outline" 
            onClick={onResetFilters}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version without card wrapper
interface CompactFiltersSectionProps {
  filters: Filters
  onUpdateFilter: (key: keyof Filters, value: string) => void
  onResetFilters: () => void
  isLoading?: boolean
  className?: string
}

export function CompactFiltersSection({
  filters,
  onUpdateFilter,
  onResetFilters,
  isLoading = false,
  className
}: CompactFiltersSectionProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${className || ''}`}>
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề hoặc mã yêu cầu..."
            value={filters.search}
            onChange={(e) => onUpdateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <Select 
        value={filters.status} 
        onValueChange={(value: StatusFilter) => onUpdateFilter('status', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="pending">Chờ xử lý</SelectItem>
          <SelectItem value="in_progress">Đang xử lý</SelectItem>
          <SelectItem value="approved">Đã duyệt</SelectItem>
          <SelectItem value="rejected">Từ chối</SelectItem>
          <SelectItem value="cancelled">Đã hủy</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select 
        value={filters.priority} 
        onValueChange={(value: PriorityFilter) => onUpdateFilter('priority', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Mức độ ưu tiên" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả mức độ</SelectItem>
          <SelectItem value="low">Thấp</SelectItem>
          <SelectItem value="medium">Trung bình</SelectItem>
          <SelectItem value="high">Cao</SelectItem>
          <SelectItem value="urgent">Khẩn cấp</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset Button */}
      <Button 
        variant="outline" 
        onClick={onResetFilters}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
