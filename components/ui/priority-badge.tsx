import { Badge } from '@/components/ui/badge'
import { AlertTriangle, LucideIcon } from 'lucide-react'

// Priority types
export type PriorityType = 'low' | 'medium' | 'high' | 'urgent'

// Priority configuration
export const priorityConfig: Record<PriorityType, {
  label: string
  color: string
  icon?: LucideIcon
}> = {
  low: { 
    label: 'Thấp', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
  },
  medium: { 
    label: 'Trung bình', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' 
  },
  high: { 
    label: 'Cao', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    icon: AlertTriangle
  },
  urgent: { 
    label: 'Khẩn cấp', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: AlertTriangle
  }
}

interface PriorityBadgeProps {
  priority: PriorityType
  showIcon?: boolean
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function PriorityBadge({ 
  priority, 
  showIcon = false, 
  variant = 'outline',
  className 
}: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  
  if (!config) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
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
      {showIcon && Icon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}

// Helper function to get priority config
export function getPriorityConfig(priority: PriorityType) {
  return priorityConfig[priority]
}

// Helper function to get all priority options for forms
export function getPriorityOptions() {
  return Object.entries(priorityConfig).map(([value, config]) => ({
    value: value as PriorityType,
    label: config.label,
    icon: config.icon
  }))
}

// Helper function to get priority weight for sorting
export function getPriorityWeight(priority: PriorityType): number {
  const weights: Record<PriorityType, number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4
  }
  return weights[priority] || 0
}
