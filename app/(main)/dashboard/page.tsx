import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ClipboardCheck, Clock } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { useAuth } from "@/hooks/use-auth-query"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <AuthenticatedLayout title="Bảng Điều Khiển">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chào mừng, {user?.full_name || 'bạn'}!</h1>
            <p className="text-muted-foreground mt-1">
              Hệ thống quản lý yêu cầu - Trường Trung Tiểu Học Việt Anh
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tạo Yêu Cầu Mới</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  +
                </div>
                <p className="text-xs text-muted-foreground">
                  Tạo yêu cầu vật tư giảng dạy
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yêu Cầu Của Tôi</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  3
                </div>
                <p className="text-xs text-muted-foreground">
                  Yêu cầu đang chờ duyệt
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lịch Sử</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  12
                </div>
                <p className="text-xs text-muted-foreground">
                  Yêu cầu đã hoàn thành
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Hệ Thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Trường Trung Tiểu Học Việt Anh</h3>
                  <p className="text-sm text-muted-foreground">
                    Hệ thống quản lý yêu cầu vật tư và tài liệu giảng dạy
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Tính năng chính</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tạo yêu cầu vật tư giảng dạy</li>
                    <li>• Quản lý quy trình duyệt</li>
                    <li>• Theo dõi trạng thái yêu cầu</li>
                    <li>• Báo cáo thống kê</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}