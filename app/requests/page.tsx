import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, History, CheckCircle, Clock, FileText, ArrowRight } from "lucide-react"
import { AppLayout } from '@/components/layout/app-layout'
import Link from 'next/link'

export default function RequestsPage() {
  const requestSections = [
    {
      title: "Tạo yêu cầu mới",
      description: "Tạo yêu cầu vật tư, thiết bị giảng dạy mới",
      icon: Plus,
      href: "/requests/create",
      color: "bg-blue-500",
      stats: "Bắt đầu ngay"
    },
    {
      title: "Lịch sử yêu cầu",
      description: "Xem tất cả các yêu cầu đã tạo trước đây",
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
      description: "Theo dõi các yêu cầu đang được xử lý",
      icon: Clock,
      href: "/requests/pending",
      color: "bg-orange-500",
      stats: "8 đang xử lý"
    }
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý yêu cầu vật tư</h1>
            <p className="text-muted-foreground">
              Chọn chức năng bạn muốn sử dụng để quản lý yêu cầu vật tư và thiết bị giảng dạy
            </p>
          </div>
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

        {/* Main Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {requestSections.map((section) => (
            <Card key={section.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${section.color}`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {section.stats}
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={section.href}>
                      Truy cập
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <p className="text-sm font-medium">Đề nghị in tài liệu - Lớp 9B</p>
                  <p className="text-xs text-muted-foreground">5 giờ trước • Đã duyệt</p>
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
