'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth-query'
import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Home, FileText, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AuthenticatedLayoutProps {
  children: ReactNode
  title?: string
}

export function AuthenticatedLayout({ children, title }: AuthenticatedLayoutProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const navigationItems = [
    { name: 'Trang chủ', href: '/dashboard', icon: Home },
    { name: 'Yêu cầu', href: '/requests', icon: FileText },
    ...(user?.role === 'admin' 
      ? [{ name: 'Quản trị', href: '/admin', icon: Shield }] 
      : []
    ),
  ]

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r bg-background">
          <div className="flex items-center h-16 px-4 border-b shrink-0">
            <h1 className="text-lg font-semibold">Hệ Thống Yêu Cầu</h1>
          </div>
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <div className="flex flex-col h-full border-r">
                <div className="flex items-center h-16 px-4 border-b">
                  <h1 className="text-lg font-semibold">Hệ Thống Yêu Cầu</h1>
                </div>
                <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
                  <nav className="flex-1 px-2 space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                            isActive(item.href)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold ml-4">{title || 'Dashboard'}</h1>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex md:items-center md:justify-between md:h-16 md:px-6 md:border-b bg-background">
          <h1 className="text-xl font-semibold">{title || 'Dashboard'}</h1>
          <div>
            <UserMenu />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}