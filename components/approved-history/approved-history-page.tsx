'use client'

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoryFilters } from './history-filters'
import { ApprovedRequestsList } from './approved-requests-list'
import { Pagination } from './pagination'
import { useApprovedHistory } from '@/hooks/useApprovedHistory'
import { useBreakpoint } from '@/hooks/use-mobile'
import { MobileHistoryView } from '@/components/supply-requests/mobile-history-view'
import type { RequestApprovalWithDetails } from '@/types/database'

interface ApprovedHistoryPageProps {
  className?: string
}

export function ApprovedHistoryPage({ className }: ApprovedHistoryPageProps) {
  const { data: approvedRequests, isLoading, isError, refetch } = useApprovedHistory()
  const { isMobile } = useBreakpoint()

  // Log when the component mounts and when data changes
  useEffect(() => {
    console.log('ApprovedHistoryPage mounted')
    return () => {
      console.log('ApprovedHistoryPage unmounted')
    }
  }, [])

  useEffect(() => {
    if (approvedRequests) {
      console.log('Approved requests updated, count:', approvedRequests.length)
    }
  }, [approvedRequests])

  // Convert RequestApprovalWithDetails to SupplyRequestWithItems format for mobile view
  const mobileData = React.useMemo(() => {
    if (!approvedRequests) return []
    return approvedRequests.map(approval => {
      const request = approval.request
      if (!request) return null
      
      // Since Request doesn't have items directly, we need to create a compatible structure
      // The MobileHistoryView expects SupplyRequestWithItems which has a required items array
      return {
        ...request,
        items: [] // Initialize with empty array since Request doesn't contain items
      }
    }).filter(Boolean) as any[] // Type assertion to match expected format
 }, [approvedRequests])

  const handleViewRequest = (id: string) => {
    console.log('View request:', id)
    // Implement navigation to request detail page
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử yêu cầu đã xử lý</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Xem lại tất cả các yêu cầu vật tư đã được xử lý trong hệ thống.
          </p>
        </CardContent>
      </Card>

      <HistoryFilters />
      
      {isMobile ? (
        <MobileHistoryView
          data={mobileData}
          isLoading={isLoading}
          onView={handleViewRequest}
        />
      ) : (
        <ApprovedRequestsList
          requests={approvedRequests as RequestApprovalWithDetails[]}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />
      )}
      
      <Pagination
        currentPage={1}
        totalPages={10}
        totalItems={100}
        itemsPerPage={10}
      />
    </div>
  )
}