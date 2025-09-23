"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge, getStatusOptions } from "@/components/ui/status-badge"
import { PriorityBadge, getPriorityOptions } from "@/components/ui/priority-badge"
import { DatePicker } from "@/components/ui/date-picker"
import { 
  Loader2, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
  Calendar,
  Package,
  User
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { vi } from "date-fns/locale"
import type { RequestApproval } from "@/types/database"
import type { StatusType } from "@/components/ui/status-badge"
import { useApprovedRequestHistory, type RequestApprovalWithDetails } from "@/hooks/useApprovedRequestHistory"
import { useBreakpoint } from "@/hooks/use-mobile"
import { ApprovedRequestsTable } from "@/components/approved-history/approved-requests-table"
import { MobileApprovedHistoryView } from "@/components/approved-history/mobile-approved-history-view"


// Mobile Card Component for better mobile UX
function MobileRequestCard({ request, onView }: { request: RequestApprovalWithDetails, onView: (id: string) => void }) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-medium text-sm leading-tight cursor-pointer hover:text-primary line-clamp-2"
              onClick={() => onView(request.id)}
            >
              {request.request?.title || 'N/A'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 inline-block px-2 py-1 rounded">
              {request.request?.request_number || 'N/A'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(request.id)}
            className="ml-2 h-8 px-2 flex-shrink-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={request.status as StatusType} />
          {request.request?.priority && <PriorityBadge priority={request.request.priority as any} />}
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
            <User className="h-3 w-3" />
            {request.approver?.full_name || 'N/A'}
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {request.approved_at ? format(new Date(request.approved_at), "dd/MM/yy HH:mm", { locale: vi }) : 'N/A'}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ApprovedHistoryPage() {
  const router = useRouter()
  const { isMobile } = useBreakpoint()

  // Table state management
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'approved_at', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as const,
    priority: 'all' as const,
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  })

  // Build query options from current state
  const queryOptions = useMemo(() => ({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    status: filters.status,
    priority: filters.priority,
    searchQuery: filters.search,
    dateFrom: filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : undefined,
    dateTo: filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : undefined,
    sortBy: (sorting[0]?.id as 'created_at' | 'updated_at' | 'approved_at' | 'status' | 'priority') || 'approved_at',
    sortOrder: (sorting[0]?.desc ? 'desc' : 'asc') as 'desc' | 'asc',
  }), [pagination, filters, sorting])

  // Fetch data with optimized caching
  const { 
    data: historyData, 
    isLoading, 
    isRefetching, 
    error, 
    refetch,
    isFetching
  } = useApprovedRequestHistory(queryOptions)

  const handleView = useCallback((requestId: string) => {
    router.push(`/supply-requests/approve/history/${requestId}`)
  }, [router])

  // Table columns definition with proper typing
  const columns = useMemo<ColumnDef<RequestApprovalWithDetails, unknown>[]>(() => [
    {
      id: 'request_number',
      accessorKey: 'request.request_number',
      header: 'Mã yêu cầu',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {getValue() as string || 'N/A'}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'title',
      accessorKey: 'request.title',
      header: 'Tiêu đề',
      cell: ({ getValue, row }) => (
        <div className="min-w-[200px] max-w-[250px] sm:max-w-[300px]">
          <span 
            className="font-medium cursor-pointer hover:text-primary line-clamp-2 text-xs sm:text-sm"
            onClick={() => handleView(row.original.id)}
            title={getValue() as string}
          >
            {getValue() as string || 'N/A'}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'approval_status',
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Trạng thái duyệt
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => <StatusBadge status={getValue() as StatusType} />,
      enableSorting: true,
    },
    {
      id: 'request_status',
      accessorKey: 'request.status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Trạng thái yêu cầu
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => <StatusBadge status={getValue() as StatusType} />,
      enableSorting: true,
    },
    {
      id: 'priority',
      accessorKey: 'request.priority',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Ưu tiên
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => {
        const priority = getValue() as string
        return priority ? <PriorityBadge priority={priority as any} /> : null
      },
      enableSorting: true,
    },
    {
      id: 'created_at',
      accessorKey: 'request.created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Ngày tạo
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => {
        const date = getValue() as string
        return (
          <div className="flex items-center gap-1 text-xs sm:text-sm min-w-[120px]">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="whitespace-nowrap">
              {date ? format(new Date(date), "dd/MM/yy HH:mm", { locale: vi }) : 'N/A'}
            </span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: 'approved_at',
      accessorKey: 'approved_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Ngày xử lý
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => {
        const date = getValue() as string
        return (
          <div className="flex items-center gap-1 text-xs sm:text-sm min-w-[120px]">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="whitespace-nowrap">
              {date ? format(new Date(date), "dd/MM/yy HH:mm", { locale: vi }) : 'N/A'}
            </span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: 'approver',
      accessorKey: 'approver.full_name',
      header: 'Người xử lý',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1 text-sm">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{getValue() as string || 'N/A'}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="min-w-[80px]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(row.original.id)}
            className="h-7 sm:h-8 px-2 sm:px-3"
          >
            <Eye className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Xem</span>
          </Button>
        </div>
      ),
    },
  ], [handleView])

  // Initialize TanStack Table
  const table = useReactTable({
    data: historyData?.data || [],
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true, // Server-side pagination
    manualSorting: true, // Server-side sorting  
    pageCount: historyData?.totalPages || 0,
  })

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    })
    setSorting([{ id: 'approved_at', desc: true }])
    setPagination({ pageIndex: 0, pageSize: 20 })
  }

  const handleQuickDateFilter = (range: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date()
    
    switch (range) {
      case 'thisMonth':
        setFilters(prev => ({
          ...prev,
          dateFrom: startOfMonth(now),
          dateTo: endOfMonth(now)
        }))
        break
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        setFilters(prev => ({
          ...prev,
          dateFrom: startOfMonth(lastMonth),
          dateTo: endOfMonth(lastMonth)
        }))
        break
      }
      case 'thisYear':
        setFilters(prev => ({
          ...prev,
          dateFrom: new Date(now.getFullYear(), 0, 1),
          dateTo: new Date(now.getFullYear(), 11, 31)
        }))
        break
    }
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Có lỗi xảy ra</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* Compact Header */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">Lịch sử duyệt yêu cầu</span>
              </h1>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {historyData?.totalCount || 0}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filter Dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Bộ lọc
                    {(filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.dateFrom || filters.dateTo) && (
                      <Badge variant="secondary" className="h-4 w-4 p-0 text-xs">
                        •
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] max-w-80 p-3 sm:p-4" align="end" side={isMobile ? "bottom" : "bottom"}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Bộ lọc</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-auto p-1 text-xs"
                      >
                        Đặt lại
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                      <Label htmlFor="search" className="text-xs">Tìm kiếm</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Tiêu đề, mã yêu cầu..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-7 h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Trạng thái duyệt</Label>
                        <Select
                          value={filters.status}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as typeof filters.status }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="approved">Đã duyệt</SelectItem>
                            <SelectItem value="rejected">Từ chối</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Ưu tiên</Label>
                        <Select
                          value={filters.priority}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value as typeof filters.priority }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {getPriorityOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  {option.icon && <option.icon className="h-3 w-3" />}
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date Filters */}
                    <div className="space-y-2">
                      <Label className="text-xs">Khoảng thời gian</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <DatePicker
                          date={filters.dateFrom}
                          onSelect={(date: Date | undefined) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                          placeholder="Từ ngày"
                        />
                        <DatePicker
                          date={filters.dateTo}
                          onSelect={(date: Date | undefined) => setFilters(prev => ({ ...prev, dateTo: date }))}
                          placeholder="Đến ngày"
                        />
                      </div>
                    </div>

                    {/* Quick Date Filters */}
                    <div className="space-y-2">
                      <Label className="text-xs">Lọc nhanh</Label>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickDateFilter('thisMonth')}
                          className="h-6 px-2 text-xs"
                        >
                          Tháng này
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickDateFilter('lastMonth')}
                          className="h-6 px-2 text-xs"
                        >
                          Tháng trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickDateFilter('thisYear')}
                          className="h-6 px-2 text-xs"
                        >
                          Năm này
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
                disabled={isRefetching || isFetching}
              >
                {isRefetching || isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Cards or Desktop Table */}
          {isMobile ? (
            /* Mobile Cards View */
            <div className="space-y-3">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 px-1">
                <h2 className="text-base font-semibold">
                  Danh sách ({historyData?.totalCount || 0})
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Hiển thị</span>
                  <Select
                    value={pagination.pageSize.toString()}
                    onValueChange={(value) => setPagination(prev => ({ ...prev, pageSize: parseInt(value), pageIndex: 0 }))}
                  >
                    <SelectTrigger className="w-16 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm">Đang tải...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyData?.data?.length ? (
                    historyData.data.map((request) => (
                      <MobileRequestCard
                        key={request.id}
                        request={request}
                        onView={handleView}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        Không tìm thấy kết quả nào
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <ApprovedRequestsTable
              requests={historyData?.data}
              isLoading={isLoading}
              isError={!!error}
              onRetry={refetch}
              onView={handleView}
            />
          )}
          
          {/* Universal Mobile-friendly Pagination */}
          {historyData && historyData.totalPages > 1 && (
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground text-center xs:text-left">
                Trang {pagination.pageIndex + 1} / {historyData.totalPages}
              </div>
              
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isMobile) {
                      setPagination(prev => ({ ...prev, pageIndex: 0 }))
                    } else {
                      table.setPageIndex(0)
                    }
                  }}
                  disabled={pagination.pageIndex === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isMobile) {
                      setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))
                    } else {
                      table.previousPage()
                    }
                  }}
                  disabled={pagination.pageIndex === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                
                <div className="flex items-center gap-1 px-3 py-1 text-xs bg-background border rounded-md min-w-[60px] justify-center">
                  <span>{pagination.pageIndex + 1}</span>
                  <span className="text-muted-foreground">/</span>
                  <span>{historyData.totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isMobile) {
                      setPagination(prev => ({ ...prev, pageIndex: Math.min(historyData.totalPages - 1, prev.pageIndex + 1) }))
                    } else {
                      table.nextPage()
                    }
                  }}
                  disabled={pagination.pageIndex >= (historyData.totalPages - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isMobile) {
                      setPagination(prev => ({ ...prev, pageIndex: historyData.totalPages - 1 }))
                    } else {
                      table.setPageIndex(historyData.totalPages - 1)
                    }
                  }}
                  disabled={pagination.pageIndex >= (historyData.totalPages - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}