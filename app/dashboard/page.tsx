'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText, 
  Plus, 
  History, 
  CheckCircle, 
  ArrowRight
} from "lucide-react"
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useApprovalPermission } from '@/hooks/use-approval-permission'

export default function DashboardPage() {
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
        <DashboardSkeleton />
      </AppLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Main Features Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
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

      {/* Recent Activity Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardContent() {
  const { canApprove } = useApprovalPermission()

  // Base features (always visible)
  const baseFeatures = [
    {
      title: "Tạo yêu cầu vật tư",
      description: "Tạo yêu cầu mới cho vật tư và thiết bị giảng dạy",
      icon: Plus,
      href: "/supply-requests/create",
      color: "bg-blue-500"
    },
    {
      title: "Lịch sử yêu cầu",
      description: "Xem và quản lý tất cả yêu cầu đã tạo",
      icon: History,
      href: "/supply-requests/history",
      color: "bg-green-500"
    },
    {
      title: "Danh sách yêu cầu",
      description: "Xem tất cả yêu cầu trong hệ thống",
      icon: FileText,
      href: "/supply-requests",
      color: "bg-orange-500"
    }
  ]

  // Approval feature (conditional)
  const approvalFeature = {
    title: "Phê duyệt yêu cầu",
    description: "Duyệt các yêu cầu từ giáo viên khác",
    icon: CheckCircle,
    href: "/supply-requests/approve",
    color: "bg-purple-500"
  }

  // Combine features based on permissions
  const mainFeatures = [
    ...baseFeatures,
    // Only show approval feature if user has permission
    ...(canApprove ? [approvalFeature] : [])
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chào mừng trở lại!</h1>
        <p className="text-muted-foreground">
          Chọn chức năng bạn muốn sử dụng trong hệ thống quản lý trường Việt Anh
        </p>
      </div>

      {/* Main Features */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quản lý yêu cầu vật tư</h2>
        <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  )
}
