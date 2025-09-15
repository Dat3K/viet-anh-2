import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Plus, 
  History, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  BarChart3,
  Users,
  Calendar,
  BookOpen
} from "lucide-react"
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  const mainFeatures = [
    {
      title: "Tạo yêu cầu vật tư",
      description: "Tạo yêu cầu mới cho vật tư và thiết bị giảng dạy",
      icon: Plus,
      href: "/requests/create",
      color: "bg-blue-500",
      stats: "Nhanh chóng"
    },
    {
      title: "Lịch sử yêu cầu",
      description: "Xem và quản lý tất cả yêu cầu đã tạo",
      icon: History,
      href: "/requests/history",
      color: "bg-green-500",
      stats: "45 yêu cầu"
    },
    {
      title: "Phê duyệt yêu cầu",
      description: "Duyệt các yêu cầu từ giáo viên khác",
      icon: CheckCircle,
      href: "/requests/approve",
      color: "bg-purple-500",
      stats: "12 chờ duyệt"
    },
    {
      title: "Yêu cầu chờ xử lý",
      description: "Theo dõi trạng thái các yêu cầu đang xử lý",
      icon: Clock,
      href: "/requests/pending",
      color: "bg-orange-500",
      stats: "8 đang xử lý"
    }
  ]

  const quickActions = [
    {
      title: "Báo cáo thống kê",
      description: "Xem báo cáo và thống kê hệ thống",
      icon: BarChart3,
      href: "/reports",
      color: "bg-indigo-500"
    },
    {
      title: "Quản lý người dùng",
      description: "Quản lý tài khoản giáo viên và nhân viên",
      icon: Users,
      href: "/users",
      color: "bg-pink-500"
    },
    {
      title: "Lịch công tác",
      description: "Xem lịch công tác và sự kiện trường",
      icon: Calendar,
      href: "/calendar",
      color: "bg-teal-500"
    },
    {
      title: "Tài liệu hướng dẫn",
      description: "Hướng dẫn sử dụng hệ thống",
      icon: BookOpen,
      href: "/docs",
      color: "bg-amber-500"
    }
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chào mừng trở lại!</h1>
          <p className="text-muted-foreground">
            Chọn chức năng bạn muốn sử dụng trong hệ thống quản lý trường Việt Anh
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tổng yêu cầu</p>
                  <p className="text-2xl font-bold">65</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Chờ xử lý</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Đã duyệt</p>
                  <p className="text-2xl font-bold">45</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tháng này</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quản lý yêu cầu vật tư</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {mainFeatures.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${feature.color}`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {feature.stats}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={feature.href}>
                        Truy cập
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Chức năng khác</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-4 rounded-full ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link href={action.href}>
                        Xem thêm
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Yêu cầu mua bút viết - Lớp 10A</p>
                  <p className="text-xs text-muted-foreground">2 giờ trước • Chờ duyệt</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Cập nhật thời khóa biểu học kỳ mới</p>
                  <p className="text-xs text-muted-foreground">5 giờ trước • Hoàn thành</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Yêu cầu thiết bị trình chiếu - Phòng họp</p>
                  <p className="text-xs text-muted-foreground">1 ngày trước • Đang xử lý</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
