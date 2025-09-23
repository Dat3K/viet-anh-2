'use client'

import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Eye, Calendar, User } from "lucide-react"
import { MobileDataView, useTableToMobileData } from "@/components/ui/mobile-data-view"
import { StatusBadge, type StatusType } from "@/components/ui/status-badge"
import { PriorityBadge } from "@/components/ui/priority-badge"
import type { RequestApproval } from "@/types/database"

// Define extended type for approved requests with related data
export interface RequestApprovalWithDetails extends RequestApproval {
  request?: {
    id: string
    title: string
    status: string
    priority: string
    created_at: string
    request_number: string
    request_types?: {
      name: string
      display_name: string
    }
  }
  step?: {
    step_name: string
    step_order: number
  }
  approver?: {
    full_name: string
    email: string
  }
}

interface MobileApprovedHistoryViewProps {
  data: RequestApprovalWithDetails[]
  isLoading?: boolean
  onView: (id: string) => void
}

export function MobileApprovedHistoryView({ data, isLoading, onView }: MobileApprovedHistoryViewProps) {
  const mobileData = useTableToMobileData({
    data,
    keyExtractor: (item) => item.id,
    titleExtractor: (item) => item.request?.title || 'N/A',
    subtitleExtractor: (item) => item.request?.request_number || '',
    metadataExtractor: (item) => [
      {
        label: "Ngày xử lý",
        value: item.approved_at 
          ? format(new Date(item.approved_at), "dd/MM/yy HH:mm", { locale: vi })
          : 'N/A',
        icon: Calendar,
      },
      {
        label: "Người xử lý",
        value: item.approver?.full_name || 'N/A',
        icon: User,
      },
    ],
    badgesExtractor: (item) => [
      {
        content: item.status ? <StatusBadge status={item.status as StatusType} /> : null,
        variant: undefined,
      },
      {
        content: item.request?.priority ? <PriorityBadge priority={item.request.priority as any} /> : null,
        variant: undefined,
      },
    ],
    actionsExtractor: (item) => [
      {
        label: "Xem",
        icon: Eye,
        onClick: () => onView(item.id),
        variant: "outline" as const,
      },
    ],
  })

  return (
    <MobileDataView
      items={mobileData}
      isLoading={isLoading}
      emptyMessage="Không tìm thấy kết quả nào"
      className="space-y-3"
      cardClassName="mobile-card"
    />
  )
}