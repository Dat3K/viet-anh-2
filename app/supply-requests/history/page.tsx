"use client"

import { useMemo, useState } from "react"
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
  Package
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import type { SupplyRequestWithItems } from "@/types/database"
import { useSupplyRequestHistory, useSupplyRequestRealtime } from "@/hooks/use-supply-requests"


export default function SupplyRequestHistoryPage() {
  const router = useRouter()

  // Table state management
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
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
    sortBy: (sorting[0]?.id as 'created_at' | 'updated_at' | 'status' | 'priority') || 'created_at',
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
  } = useSupplyRequestHistory(queryOptions)

  // 🚀 OPTIMIZED REALTIME - Auto-update when data changes
  const realtimeStatus = useSupplyRequestRealtime({
    enableOptimizations: true,
    debounceMs: 200, // Slightly higher for history page
    enableHealthMonitoring: true
  })

  // Table columns definition with proper typing
  const columns = useMemo<ColumnDef<SupplyRequestWithItems, unknown>[]>(() => [
    {
      id: 'request_number',
      accessorKey: 'request_number',
      header: 'Mã yêu cầu',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {getValue() as string}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Tiêu đề',
      cell: ({ getValue, row }) => (
        <div className="max-w-[300px]">
          <span 
            className="font-medium cursor-pointer hover:text-primary line-clamp-2"
            onClick={() => handleView(row.original.id)}
            title={getValue() as string}
          >
            {getValue() as string}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Trạng thái
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-2 h-3 w-3" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => <StatusBadge status={getValue() as any} />,
      enableSorting: true,
    },
    {
      id: 'priority',
      accessorKey: 'priority',
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
      cell: ({ getValue }) => <PriorityBadge priority={getValue() as any} />,
      enableSorting: true,
    },
    {
      id: 'items_count',
      accessorKey: 'items',
      header: 'Vật tư',
      cell: ({ getValue }) => {
        const items = getValue() as any[]
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>{items?.length || 0}</span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
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
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>
              {date ? format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi }) : 'N/A'}
            </span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleView(row.original.id)}
          className="h-8"
        >
          <Eye className="h-3 w-3 mr-1" />
          Xem
        </Button>
      ),
    },
  ], [])

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

  const handleView = (requestId: string) => {
    router.push(`/supply-requests/${requestId}`)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    })
    setSorting([{ id: 'created_at', desc: true }])
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <History className="h-8 w-8" />
              Lịch sử yêu cầu
            </h1>
            <p className="text-muted-foreground">
              Xem và quản lý lịch sử các yêu cầu vật tư của bạn
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {historyData?.totalCount || 0} yêu cầu
            </Badge>
            
            {/* 🚀 REALTIME CONNECTION STATUS */}
            <Badge 
              variant={realtimeStatus.isHealthy ? "default" : "secondary"}
              className={`transition-colors ${realtimeStatus.isHealthy ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
            >
              {realtimeStatus.isConnected ? (
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${realtimeStatus.isHealthy ? 'bg-green-200 animate-pulse' : 'bg-yellow-200'}`} />
                  {realtimeStatus.isHealthy ? 'Realtime' : 'Lỗi kết nối'}
                </span>
              ) : (
                'Offline'
              )}
            </Badge>
            
            <Button 
              onClick={() => {
                refetch()
                realtimeStatus.refreshHealth()
              }} 
              variant="outline" 
              disabled={isRefetching || isFetching}
            >
              {isRefetching || isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Làm mới
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Tìm theo tiêu đề, mã yêu cầu..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as typeof filters.status }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {getStatusOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-3 w-3" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label>Mức độ ưu tiên</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value as typeof filters.priority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mức độ</SelectItem>
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

              {/* Reset Button */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={handleResetFilters}
                  className="w-full"
                >
                  Đặt lại
                </Button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Từ ngày</Label>
                <DatePicker
                  date={filters.dateFrom}
                  onSelect={(date: Date | undefined) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                  placeholder="Chọn ngày bắt đầu"
                />
              </div>
              <div className="space-y-2">
                <Label>Đến ngày</Label>
                <DatePicker
                  date={filters.dateTo}
                  onSelect={(date: Date | undefined) => setFilters(prev => ({ ...prev, dateTo: date }))}
                  placeholder="Chọn ngày kết thúc"
                />
              </div>
              
              {/* Quick Date Filters */}
              <div className="space-y-2 lg:col-span-2">
                <Label>Lọc nhanh</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter('thisMonth')}
                  >
                    Tháng này
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter('lastMonth')}
                  >
                    Tháng trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter('thisYear')}
                  >
                    Năm này
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách ({historyData?.totalCount || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Đang tải...</span>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="bg-muted/50">
                              {header.isPlaceholder
                                ? null
                                : header.column.columnDef.header
                                ? typeof header.column.columnDef.header === 'function'
                                  ? header.column.columnDef.header(header.getContext())
                                  : header.column.columnDef.header
                                : header.id}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="py-3">
                                {typeof cell.column.columnDef.cell === 'function'
                                  ? cell.column.columnDef.cell(cell.getContext())
                                  : cell.getValue() as string}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center text-muted-foreground"
                          >
                            Không tìm thấy kết quả nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {historyData && historyData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Hiển thị {pagination.pageIndex * pagination.pageSize + 1} đến{' '}
                        {Math.min((pagination.pageIndex + 1) * pagination.pageSize, historyData.totalCount)} trong{' '}
                        {historyData.totalCount} kết quả
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">Trang</span>
                        <strong className="text-sm">
                          {pagination.pageIndex + 1} / {historyData.totalPages}
                        </strong>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
