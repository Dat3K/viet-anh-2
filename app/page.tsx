import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, Shield, BookOpen, FileText, Users, ClipboardCheck, School } from "lucide-react"
import { MicrosoftLoginCard } from "@/components/auth/microsoft-login-button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            🏫 Trường Trung Tiểu Học Việt Anh
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Hệ Thống Quản Lý
            <span className="text-primary block">Yêu Cầu Trường Học</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Hệ thống quản lý yêu cầu hiện đại cho Trường Trung Tiểu Học Việt Anh. 
            Dành cho giáo viên, trưởng bộ môn và ban giám hiệu để quản lý quy trình 
            duyệt yêu cầu vật tư và tài liệu một cách hiệu quả.
          </p>
          
          {/* Microsoft Login Section */}
          <div className="max-w-md mx-auto mb-8">
            <MicrosoftLoginCard />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="#features">
                Tìm Hiểu Thêm
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Features Section */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Quản Lý Yêu Cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tạo và quản lý các yêu cầu vật tư, thiết bị và tài liệu giảng dạy 
                một cách dễ dàng và hiệu quả.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <ClipboardCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Quy Trình Duyệt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Quy trình duyệt tự động từ giáo viên, trưởng bộ môn đến 
                ban giám hiệu với thông báo thời gian thực.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Quản Lý Vai Trò</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Phân quyền rõ ràng cho giáo viên, trưởng bộ môn và ban giám hiệu 
                để đảm bảo an toàn thông tin.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center mb-6">Tính Năng Chính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Tạo yêu cầu vật tư động',
                'Giao diện thân thiện cho tất cả vai trò',
                'Quy trình duyệt tự động theo cấp bậc',
                'Thông báo thời gian thực',
                'Giao diện thân thiện trên mọi thiết bị',
                'Chế độ sáng/tối linh hoạt',
                'Báo cáo thống kê chi tiết',
                'Lịch sử thay đổi và kiểm soát',
                'Phân quyền theo vai trò giảng dạy',
                'Tích hợp với hệ thống trường học',
                'Sao lưu và bảo mật dữ liệu',
                'Hỗ trợ tiếng Việt hoàn chỉnh'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Workflow Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Quy Trình Hoạt Động</h2>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
              {/* Step 1 */}
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  1
                </div>
                <h3 className="font-semibold mb-2">Tạo Yêu Cầu</h3>
                <p className="text-sm text-muted-foreground">
                  Giáo viên tạo yêu cầu vật tư giảng dạy cần thiết
                </p>
              </div>
              
              {/* Arrow 1 */}
              <div className="hidden md:flex">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              
              {/* Step 2 */}
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  2
                </div>
                <h3 className="font-semibold mb-2">Duyệt Bộ Môn</h3>
                <p className="text-sm text-muted-foreground">
                  Trưởng bộ môn kiểm tra và duyệt yêu cầu
                </p>
              </div>
              
              {/* Arrow 2 */}
              <div className="hidden md:flex">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              
              {/* Step 3 */}
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  3
                </div>
                <h3 className="font-semibold mb-2">Phê Duyệt Cuối</h3>
                <p className="text-sm text-muted-foreground">
                  Ban giám hiệu phê duyệt cuối cùng
                </p>
              </div>
              
              {/* Arrow 3 */}
              <div className="hidden md:flex">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              
              {/* Step 4 */}
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  4
                </div>
                <h3 className="font-semibold mb-2">Hoàn Thành</h3>
                <p className="text-sm text-muted-foreground">
                  Yêu cầu được phê duyệt và thực hiện
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* User Roles Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Dành Cho Tất Cả Các Vai Trò</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <CardTitle>Giáo Viên</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Tạo yêu cầu vật tư giảng dạy</li>
                  <li>• Theo dõi tiến trình duyệt</li>
                  <li>• Xem lịch sử yêu cầu của bản thân</li>
                  <li>• Nhận thông báo cập nhật</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle>Trưởng Bộ Môn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Duyệt yêu cầu của giáo viên</li>
                  <li>• Chỉnh sửa danh sách vật tư</li>
                  <li>• Quản lý bộ môn của mình</li>
                  <li>• Theo dõi thống kê bộ môn</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <School className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <CardTitle>Ban Giám Hiệu</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Phê duyệt cuối cùng</li>
                  <li>• Quản lý toàn bộ hệ thống</li>
                  <li>• Xem báo cáo tổng thể</li>
                  <li>• Cấu hình quy trình duyệt</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}