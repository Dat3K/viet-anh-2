import { Badge } from '@/components/ui/badge'
import { 
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  LucideIcon
} from 'lucide-react'

// Status types
export type StatusType = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled'

// Status configuration
export const statusConfig: Record<StatusType, {
  label: string
  color: string
  icon: LucideIcon
}> = {
  pending: { 
    label: 'Chờ xử lý', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Clock
  },
  in_progress: { 
    label: 'Đang xử lý', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: RefreshCw
  },
  approved: { 
    label: 'Đã duyệt', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle
  },
  rejected: { 
    label: 'Từ chối', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: XCircle
  },
  cancelled: { 
    label: 'Đã hủy', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    icon: XCircle
  }
}

interface StatusBadgeProps {
  status: StatusType
  showIcon?: boolean
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function StatusBadge({ 
  status, 
  showIcon = true, 
  variant = 'secondary',
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status]
  
  if (!config) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Không xác định
      </Badge>
    )
  }

  const Icon = config.icon

  return (
    <Badge 
      variant={variant} 
      className={`${config.color} ${className || ''}`}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}

// Helper function to get status config
export function getStatusConfig(status: StatusType) {
  return statusConfig[status]
}

// Helper function to get all status options for forms
export function getStatusOptions() {
  return Object.entries(statusConfig).map(([value, config]) => ({
    value: value as StatusType,
    label: config.label,
    icon: config.icon
  }))
}
