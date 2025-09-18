'use client'

import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  useSupplyRequests, 
  useSupplyRequestFilters,
  useSupplyRequestStats,
  useDeleteSupplyRequest,
  useSupplyRequestRealtime
} from '@/hooks/use-supply-requests'
import {
  StatsCards,
  FiltersSection,
  RequestsTable,
  EmptyState
} from '@/components/supply-requests'

export default function SupplyRequestsPage() {
  const router = useRouter()
  
  // Use hooks
  const { data: requests = [], isLoading, error } = useSupplyRequests()
  const { filters, updateFilter, resetFilters } = useSupplyRequestFilters()
  const stats = useSupplyRequestStats(requests)
  
  // Enable real-time updates
  useSupplyRequestRealtime()
  
  // Mutations
  const deleteMutation = useDeleteSupplyRequest()

  // Filter requests based on current filters
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !filters.search || 
      request.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      request.request_number.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesStatus = filters.status === 'all' || request.status === filters.status
    const matchesPriority = filters.priority === 'all' || request.priority === filters.priority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleDelete = async (requestId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) return
    
    try {
      await deleteMutation.mutateAsync(requestId)
      toast.success('Xóa yêu cầu thành công!')
    } catch (error) {
      console.error(error)
      toast.error('Không thể xóa yêu cầu')
    }
  }

  const handleView = (requestId: string) => {
    router.push(`/supply-requests/${requestId}`)
  }

  const handleEdit = (requestId: string) => {
    router.push(`/supply-requests/${requestId}/edit`)
  }

  const handleCreateNew = () => {
    router.push('/supply-requests/create')
  }

  const hasFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all'

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Có lỗi xảy ra</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => router.refresh()} variant="outline">
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
            <h1 className="text-3xl font-bold tracking-tight">Yêu cầu vật tư</h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi các yêu cầu vật tư của bạn
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo yêu cầu mới
          </Button>
        </div>

        {/* Statistics Cards */}
        <StatsCards stats={stats} />

        {/* Filters */}
        <FiltersSection
          filters={filters}
          onUpdateFilter={updateFilter}
          onResetFilters={resetFilters}
          isLoading={isLoading}
        />

        {/* Requests Table */}
        {filteredRequests.length === 0 && !isLoading ? (
          <EmptyState
            type={hasFilters ? 'no-filtered-results' : 'no-requests'}
            onCreateNew={handleCreateNew}
            onResetFilters={hasFilters ? resetFilters : undefined}
          />
        ) : (
          <RequestsTable
            requests={filteredRequests}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateNew={handleCreateNew}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  )
}