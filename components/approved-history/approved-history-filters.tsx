import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, RefreshCw, Calendar, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { StatusType } from '@/components/ui/status-badge'
import { PriorityType } from '@/components/ui/priority-badge'

export type StatusFilter = StatusType | 'all'
export type PriorityFilter = PriorityType | 'all'

interface Filters {
  search: string
  status: StatusFilter
  priority: PriorityFilter
  dateFrom: Date | null
  dateTo: Date | null
}

interface ApprovedHistoryFiltersProps {
  className?: string
  onFilterChange?: (filters: Filters) => void
}

export function ApprovedHistoryFilters({ className, onFilterChange }: ApprovedHistoryFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    priority: 'all',
    dateFrom: null,
    dateTo: null
  })

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      status: 'all' as StatusFilter,
      priority: 'all' as PriorityFilter,
      dateFrom: null,
      dateTo: null
    }
    setFilters(resetFilters)
    onFilterChange?.(resetFilters)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Bộ lọc lịch sử duyệt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tiêu đề hoặc mã yêu cầu..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Status Filter */}
            <Select 
              value={filters.status} 
              onValueChange={(value: StatusFilter) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái duyệt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select 
              value={filters.priority} 
              onValueChange={(value: PriorityFilter) => handleFilterChange('priority', value)}
            >
              <SelectTrigger>
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

            {/* Date From */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Từ ngày"
                value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : null)}
                className="pl-10"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Đến ngày"
                value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : null)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}