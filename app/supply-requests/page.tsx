'use client'

import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  History,
  CheckCircle,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Package,
  Users,
  AlertCircle
} from 'lucide-react'
import { useSupplyRequests, useSupplyRequestStats, useSupplyRequestRealtime } from '@/hooks/use-supply-requests'

// Menu items configuration
const menuItems = [
  {
    title: 'Tạo yêu cầu mới',
    description: 'Tạo yêu cầu vật tư cho dự án hoặc hoạt động',
    href: '/supply-requests/create',
    icon: Plus,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  {
    title: 'Lịch sử yêu cầu',
    description: 'Xem tất cả yêu cầu đã tạo và trạng thái của chúng',
    href: '/supply-requests/history',
    icon: History,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    title: 'Phê duyệt yêu cầu',
    description: 'Xem xét và phê duyệt các yêu cầu đang chờ xử lý',
    href: '/supply-requests/approve',
    icon: CheckCircle,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  {
    title: 'Lịch sử phê duyệt',
    description: 'Xem lại các yêu cầu đã được phê duyệt trước đó',
    href: '/supply-requests/approve/history',
    icon: History,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900',
    borderColor: 'border-purple-200 dark:border-purple-800'
  }
]

export default function SupplyRequestsMenuPage() {
  const router = useRouter()
  
  // Fetch data for statistics
  const { data: requests = [], isLoading, error } = useSupplyRequests()
  const stats = useSupplyRequestStats(requests)
  
  // Enable real-time updates
  const realtimeStatus = useSupplyRequestRealtime({
    enableOptimizations: true,
    debounceMs: 300,
    enableHealthMonitoring: true
  })

  const handleNavigate = (href: string) => {
    router.push(href)
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
          <Button onClick={() => router.refresh()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header - Optimized for Mobile */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="break-words">Quản lý yêu cầu vật tư</span>
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Trung tâm điều hướng cho tất cả các chức năng quản lý yêu cầu vật tư
            </p>
          </div>
          
          {/* Real-time status indicator - Mobile optimized */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Badge 
              variant={realtimeStatus.isHealthy ? "default" : "secondary"}
              className={`transition-colors text-xs ${realtimeStatus.isHealthy ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
            >
              {realtimeStatus.isConnected ? (
                <span className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${realtimeStatus.isHealthy ? 'bg-green-200 animate-pulse' : 'bg-yellow-200'}`} />
                  {realtimeStatus.isHealthy ? 'Kết nối' : 'Lỗi kết nối'}
                </span>
              ) : (
                'Offline'
              )}
            </Badge>
          </div>
        </div>

        {/* Quick Stats Overview - Optimized for Mobile (2 columns) */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                Tổng yêu cầu
              </CardTitle>
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                {isLoading ? '...' : stats.total}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Tất cả yêu cầu
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">
                Đã phê duyệt
              </CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">
                {isLoading ? '...' : stats.approved}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Yêu cầu đã duyệt
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Chờ xử lý
              </CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg sm:text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {isLoading ? '...' : (stats.pending + stats.inProgress)}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Cần xem xét
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-200">
                Tổng vật tư
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                {isLoading ? '...' : stats.totalItems}
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Vật tư đã yêu cầu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Menu - Optimized for Mobile (2 columns) */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Chức năng chính
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Card 
                  key={item.href}
                  className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${item.bgColor} ${item.borderColor}`}
                  onClick={() => handleNavigate(item.href)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor}`} />
                      </div>
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-base sm:text-lg group-hover:text-foreground transition-colors">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs sm:text-sm group-hover:text-muted-foreground transition-colors">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions - Optimized for Mobile (2 columns) */}
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Thao tác nhanh
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Các thao tác thường dùng để tăng hiệu quả làm việc
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Button 
                onClick={() => handleNavigate('/supply-requests/create')}
                className="justify-start h-auto p-3 sm:p-4 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">Tạo yêu cầu</div>
                  <div className="text-xs opacity-90">Bắt đầu yêu cầu mới</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => handleNavigate('/supply-requests/history')}
                variant="outline"
                className="justify-start h-auto p-3 sm:p-4 hover:bg-muted"
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">Xem lịch sử</div>
                  <div className="text-xs text-muted-foreground">Theo dõi tiến độ</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => handleNavigate('/supply-requests/approve')}
                variant="outline"
                className="justify-start h-auto p-3 sm:p-4 hover:bg-muted"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">Phê duyệt</div>
                  <div className="text-xs text-muted-foreground">Xem xét yêu cầu</div>
                </div>
              </Button>

              <Button 
                onClick={() => handleNavigate('/supply-requests/approve/history')}
                variant="outline"
                className="justify-start h-auto p-3 sm:p-4 hover:bg-muted"
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">Lịch sử phê duyệt</div>
                  <div className="text-xs text-muted-foreground">Xem yêu cầu đã duyệt</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}