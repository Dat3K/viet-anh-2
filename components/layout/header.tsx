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
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isCurrentPage ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Spacer */}
      <div className="ml-auto" />
      
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* User Navigation */}
      <UserNav />
    </header>
  )
}
