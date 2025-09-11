import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Filter } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"

export default function RequestsPage() {

  const requests = [
    {
      id: "1",
      title: "Yêu cầu mua bút viết",
      status: "pending",
      priority: "medium",
      createdAt: "2024-01-15",
      department: "Toán học",
    },
    {
      id: "2",
      title: "Đề nghị in tài liệu",
      status: "approved",
      priority: "high",
      createdAt: "2024-01-14",
      department: "Văn học",
    },
    {
      id: "3",
      title: "Yêu cầu thiết bị trình chiếu",
      status: "rejected",
      priority: "low",
      createdAt: "2024-01-13",
      department: "Tin học",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Đã duyệt</Badge>
      case "pending":
        return <Badge variant="secondary">Chờ duyệt</Badge>
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>
      default:
        return <Badge variant="outline">Không xác định</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">Cao</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Trung bình</Badge>
      case "low":
        return <Badge className="bg-green-500">Thấp</Badge>
      default:
        return <Badge variant="outline">Không xác định</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout title="Quản Lý Yêu Cầu">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Yêu Cầu Của Tôi</h1>
              <p className="text-muted-foreground">
                Quản lý và theo dõi các yêu cầu vật tư, thiết bị
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo Yêu Cầu Mới
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm yêu cầu..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Bộ lọc
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {request.department} • {request.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {requests.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Chưa có yêu cầu nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu bằng cách tạo yêu cầu đầu tiên của bạn
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo Yêu Cầu Mới
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}