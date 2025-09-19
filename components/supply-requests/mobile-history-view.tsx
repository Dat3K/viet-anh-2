'use client'

import { useMemo } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Eye, Calendar, Package } from "lucide-react"
import { MobileDataView, useTableToMobileData } from "@/components/ui/mobile-data-view"
import { StatusBadge } from "@/components/ui/status-badge"
import { PriorityBadge } from "@/components/ui/priority-badge"
import type { SupplyRequestWithItems } from "@/types/database"

interface MobileHistoryViewProps {
  data: SupplyRequestWithItems[]
  isLoading?: boolean
  onView: (id: string) => void
}

export function MobileHistoryView({ data, isLoading, onView }: MobileHistoryViewProps) {
  const mobileData = useTableToMobileData({
    data,
    keyExtractor: (item) => item.id,
    titleExtractor: (item) => item.title,
    subtitleExtractor: (item) => item.request_number,
    metadataExtractor: (item) => [
      {
        label: "Ngày tạo",
        value: item.created_at 
          ? format(new Date(item.created_at), "dd/MM/yy HH:mm", { locale: vi })
          : 'N/A',
        icon: Calendar,
      },
      {
        label: "Vật tư",
        value: `${item.items?.length || 0} mục`,
        icon: Package,
      },
    ],
    badgesExtractor: (item) => [
      {
        content: <StatusBadge status={item.status as any} />,
        variant: undefined as any,
      },
      {
        content: <PriorityBadge priority={item.priority as any} />,
        variant: undefined as any,
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
