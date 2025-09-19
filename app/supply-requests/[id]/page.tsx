'use client'

import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { RequestDetail } from '@/components/supply-requests/request-detail'
import { ArrowLeft, ExternalLink } from 'lucide-react'

/**
 * Supply Request Detail Page
 * Displays comprehensive information about a specific supply request
 * Supports viewing, editing (for owners), and approval (for approvers)
 */
export default function SupplyRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params?.id as string

  if (!requestId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold">ID yêu cầu không hợp lệ</h2>
            <p className="text-muted-foreground mt-2">Vui lòng kiểm tra lại đường dẫn</p>
            <Button
              onClick={() => router.push('/supply-requests')}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const handleApprovalProcessed = (action: 'approve' | 'reject', result: any) => {
    // Could redirect to approval page or show success message
    // For now, we'll stay on the page to show the updated status
    console.log('Approval processed:', action, result)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open(`/supply-requests/${requestId}`, '_blank')}
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Mở tab mới
          </Button>
        </div>

        {/* Request Detail Component */}
        <RequestDetail
          requestId={requestId}
          mode="full"
          variant="page"
          showActions={true}
          allowItemEditing={true}
          onApprovalProcessed={handleApprovalProcessed}
        />
      </div>
    </AppLayout>
  )
}
