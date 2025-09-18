import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  LucideIcon
} from 'lucide-react'

interface StatCard {
  title: string
  value: number
  icon: LucideIcon
  iconColor: string
}

interface StatsCardsProps {
  stats: {
    total: number
    pending: number
    inProgress: number
    approved: number
    rejected: number
  }
  className?: string
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  const statCards: StatCard[] = [
    {
      title: 'Tổng số',
      value: stats.total,
      icon: Package,
      iconColor: 'text-muted-foreground'
    },
    {
      title: 'Chờ xử lý',
      value: stats.pending,
      icon: Clock,
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Đang xử lý',
      value: stats.inProgress,
      icon: RefreshCw,
      iconColor: 'text-blue-600'
    },
    {
      title: 'Đã duyệt',
      value: stats.approved,
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    {
      title: 'Từ chối',
      value: stats.rejected,
      icon: XCircle,
      iconColor: 'text-red-600'
    }
  ]

  return (
    <div className={`grid gap-4 md:grid-cols-5 ${className || ''}`}>
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Alternative compact version
interface CompactStatsCardsProps {
  stats: {
    total: number
    pending: number
    inProgress: number
    approved: number
    rejected: number
  }
  className?: string
}

export function CompactStatsCards({ stats, className }: CompactStatsCardsProps) {
  const statItems = [
    { label: 'Tổng', value: stats.total, color: 'text-gray-600' },
    { label: 'Chờ', value: stats.pending, color: 'text-yellow-600' },
    { label: 'Xử lý', value: stats.inProgress, color: 'text-blue-600' },
    { label: 'Duyệt', value: stats.approved, color: 'text-green-600' },
    { label: 'Từ chối', value: stats.rejected, color: 'text-red-600' }
  ]

  return (
    <div className={`flex items-center gap-6 ${className || ''}`}>
      {statItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{item.label}:</span>
          <span className={`font-semibold ${item.color}`}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}
