'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Plus,
  History,
  CheckCircle,
  ArrowRight,
  Users,
  Shield,
  BookOpen,
  School,
  ClipboardCheck
} from "lucide-react"
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useApprovalPermission } from '@/hooks/use-approval-permission'
import { useUserProfile } from '@/hooks/use-profile'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <AppLayout>
        <HomeSkeleton />
      </AppLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <HomeContent />
    </AppLayout>
  )
}

function HomeSkeleton() {
  return (
    <div suppressHydrationWarning className="space-y-6">
      {/* Hero Section Skeleton */}
      <div suppressHydrationWarning className="text-center space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>

      {/* Main Features Skeleton */}
      <div suppressHydrationWarning>
        <Skeleton className="h-6 w-48 mb-4" />
        <div suppressHydrationWarning className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Info Skeleton */}
      <div suppressHydrationWarning className="grid md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="text-center">
              <Skeleton className="h-12 w-12 mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function HomeContent() {
  const { canApprove } = useApprovalPermission()
  const { profile } = useUserProfile()
  
  const allFeatures = [
    {
      title: "Tạo yêu cầu vật tư",
      description: "Tạo yêu cầu mới cho vật tư và thiết bị giảng dạy",
      icon: Plus,
      href: "/supply-requests/create",
      color: "bg-blue-500",
      showForAll: true
    },
    {
      title: "Lịch sử yêu cầu",
      description: "Xem và quản lý tất cả yêu cầu đã tạo",
      icon: History,
      href: "/supply-requests/history",
      color: "bg-green-500",
      showForAll: true
    },
    {
      title: "Phê duyệt yêu cầu",
      description: "Duyệt các yêu cầu từ giáo viên khác",
      icon: CheckCircle,
      href: "/supply-requests/approve",
      color: "bg-purple-500",
      requiresApproval: true
    },
    {
      title: "Danh sách yêu cầu",
      description: "Xem tất cả yêu cầu trong hệ thống",
      icon: FileText,
      href: "/supply-requests",
      color: "bg-orange-500",
      requiresApproval: true
    }
  ]

  // Filter features based on permissions
  const mainFeatures = allFeatures.filter(feature => {
    if (feature.showForAll) return true
    if (feature.requiresApproval && canApprove) return true
    return false
  })

  // Filter user roles to show only the current user's role
  const getCurrentUserRole = () => {
    if (!profile?.role?.name) return null
    
    const allUserRoles = [
      {
        title: "Giáo Viên",
        icon: BookOpen,
        color: "text-blue-500",
        description: "Tạo và theo dõi yêu cầu vật tư giảng dạy",
        features: [
          "Tạo yêu cầu vật tư giảng dạy",
          "Theo dõi tiến trình duyệt",
          "Xem lịch sử yêu cầu của bản thân",
          "Nhận thông báo cập nhật"
        ],
        roleNames: ['teacher', 'giao_vien']
      },
      {
        title: "Trưởng Bộ Môn",
        icon: Shield,
        color: "text-green-500",
        description: "Duyệt và quản lý yêu cầu trong bộ môn",
        features: [
          "Duyệt yêu cầu của giáo viên",
          "Chỉnh sửa danh sách vật tư",
          "Quản lý bộ môn của mình",
          "Theo dõi thống kê bộ môn"
        ],
        roleNames: ['department_head', 'truong_bo_mon', 'head']
      },
      {
        title: "Ban Giám Hiệu",
        icon: School,
        color: "text-purple-500",
        description: "Quản lý toàn bộ hệ thống",
        features: [
          "Phê duyệt cuối cùng",
          "Quản lý toàn bộ hệ thống",
          "Xem báo cáo tổng thể",
          "Cấu hình quy trình duyệt"
        ],
        roleNames: ['admin', 'ban_giam_hieu', 'principal', 'director']
      }
    ]

    const userRole = allUserRoles.find(role => 
      role.roleNames.some(name => 
        profile.role?.name?.toLowerCase().includes(name.toLowerCase())
      )
    )
    
    return userRole || allUserRoles[0] // Default to teacher role if no match
  }

  const userRole = getCurrentUserRole()
  const userRoles = userRole ? [userRole] : []

  return (
    <div suppressHydrationWarning className="space-y-8">
      {/* Hero Section */}
      <div suppressHydrationWarning className="text-center space-y-4">
        <Badge variant="secondary" className="mb-4">
          🏫 Trường Trung Tiểu Học Việt Anh
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Hệ Thống Quản Lý
          <span className="text-primary block">Yêu Cầu Trường Học</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Hệ thống quản lý yêu cầu hiện đại. Dành cho giáo viên, trưởng bộ môn và ban giám hiệu
          để quản lý quy trình duyệt yêu cầu vật tư và tài liệu một cách hiệu quả.
        </p>
      </div>

      {/* Main Features */}
      <div suppressHydrationWarning>
        <h2 className="text-2xl font-semibold mb-6">Chức Năng Hệ Thống</h2>
        <div suppressHydrationWarning className="grid gap-4 md:grid-cols-2">
          {mainFeatures.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <Link href={feature.href}>
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
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* User Roles */}
      {userRoles.length > 0 && (
        <div suppressHydrationWarning>
          <h2 className="text-2xl font-semibold mb-6">Vai Trò Của Bạn</h2>
          <div suppressHydrationWarning className="grid md:grid-cols-3 gap-6">
            {userRoles.map((role) => (
              <Card key={role.title} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <role.icon className={`h-12 w-12 mx-auto mb-4 ${role.color}`} />
                  <CardTitle>{role.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2 text-left">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* System Features */}
      <Card suppressHydrationWarning>
        <CardHeader suppressHydrationWarning>
          <CardTitle className="text-center mb-6">Tính Năng Chính</CardTitle>
        </CardHeader>
        <CardContent suppressHydrationWarning>
          <div suppressHydrationWarning className="grid md:grid-cols-2 gap-4">
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
              <div key={index} suppressHydrationWarning className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}