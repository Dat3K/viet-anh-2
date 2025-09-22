'use client'

import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { RequestDetail } from './request-detail'
import { Badge } from '@/components/ui/badge'
import type { ProcessRequestApprovalWithItemsRPCResult } from '@/types/database'

interface RequestDetailModalProps {
  requestId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  /** Display mode - controls what features are available */
  mode?: 'view' | 'edit' | 'approve' | 'full'
  /** Whether to show actions (approve/reject buttons) */
  showActions?: boolean
  /** Whether to show item editing capabilities */
  allowItemEditing?: boolean
  /** Modal title override */
  title?: string
  /** Callback when approval is processed */
  onApprovalProcessed?: (action: 'approve' | 'reject', result: ProcessRequestApprovalWithItemsRPCResult) => void
}

/**
 * Modal wrapper for RequestDetail component
 * Provides a clean modal interface for viewing/editing requests
 */
export function RequestDetailModal({
  requestId,
  isOpen,
  onOpenChange,
  mode = 'view',
  showActions = false,
  allowItemEditing = false,
  title,
  onApprovalProcessed
}: RequestDetailModalProps) {
  const handleApprovalProcessed = (action: 'approve' | 'reject', result: ProcessRequestApprovalWithItemsRPCResult) => {
    // Close modal on successful approval
    onOpenChange(false)
    onApprovalProcessed?.(action, result)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {title || 'Chi tiết yêu cầu vật tư'}
            <Badge variant="outline" className="text-xs">
              {requestId.slice(0, 8)}...
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          <RequestDetail
            requestId={requestId}
            mode={mode}
            variant="modal"
            showActions={showActions}
            allowItemEditing={allowItemEditing}
            onApprovalProcessed={handleApprovalProcessed}
            className="space-y-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RequestDetailModal
