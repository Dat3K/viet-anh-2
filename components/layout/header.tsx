'use client'

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { UserNav } from "@/components/auth/user-nav"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { usePathname } from "next/navigation"

// Map paths to Vietnamese breadcrumb names
const pathMap: Record<string, string> = {
  '/dashboard': 'Trang chủ',
  '/requests': 'Yêu cầu vật tư',
  '/supply-requests': 'Yêu cầu vật tư',
  '/supply-requests/create': 'Tạo yêu cầu',
  '/supply-requests/history': 'Lịch sử yêu cầu',
  '/supply-requests/approve': 'Phê duyệt yêu cầu',
  '/supply-requests/approve/history': 'Lịch sử phê duyệt',
  '/students': 'Quản lý học sinh',
  '/schedule': 'Thời khóa biểu',
  '/materials': 'Tài liệu giảng dạy',
  '/profile': 'Hồ sơ cá nhân',
  '/settings': 'Cài đặt',
  '/admin': 'Quản trị viên',
  '/admin/reports': 'Báo cáo thống kê',
  '/admin/users': 'Quản lý người dùng',
  '/admin/settings': 'Cài đặt hệ thống',
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []
  
  // Always start with dashboard
  breadcrumbs.push({
    href: '/dashboard',
    label: 'Trang chủ',
    isCurrentPage: pathname === '/dashboard'
  })
  
  // If not on dashboard, build breadcrumbs from path segments
  if (pathname !== '/dashboard') {
    let currentPath = ''
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      const label = pathMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      breadcrumbs.push({
        href: currentPath,
        label,
        isCurrentPage: isLast
      })
    })
  }
  
  return breadcrumbs
}

export function Header() {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-50 flex h-14 sm:h-16 shrink-0 items-center gap-1 sm:gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4">
      <SidebarTrigger className="h-8 w-8 sm:h-10 sm:w-10 -ml-1" />
      <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4" />
      
      {/* Breadcrumbs - responsive */}
      <div className="flex-1 min-w-0">
        <Breadcrumb className="overflow-hidden">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
                <BreadcrumbItem className={index === 0 ? "hidden sm:block" : ""}>
                  {crumb.isCurrentPage ? (
                    <BreadcrumbPage className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href} className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Actions - compact on mobile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme Toggle - show from small screens up */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        
        {/* User Navigation */}
        <UserNav />
      </div>
    </header>
  )
}
