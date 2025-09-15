'use client'

import { 
  FileText, 
  Plus, 
  History,
  CheckCircle,
  Clock,
  ChevronRight,
  Home
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"

// Supply request sub-items
const requestSubItems = [
  {
    title: "Tạo yêu cầu",
    url: "/requests/create",
    icon: Plus,
  },
  {
    title: "Lịch sử yêu cầu",
    url: "/requests/history",
    icon: History,
  },
  {
    title: "Phê duyệt yêu cầu",
    url: "/requests/approve",
    icon: CheckCircle,
  },
  {
    title: "Yêu cầu chờ xử lý",
    url: "/requests/pending",
    icon: Clock,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isRequestsActive = pathname.startsWith('/requests')
  const isDashboardActive = pathname === '/dashboard'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 px-2 py-2">
          <Image 
            src="https://wbfbugqjkzczthqjvnwd.supabase.co/storage/v1/object/public/image/logo.png" 
            alt="Trường Việt Anh Logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">Trường Việt Anh</span>
            <span className="text-xs text-muted-foreground truncate">Hệ thống quản lý</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Điều hướng chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isDashboardActive}
                  tooltip="Trang chủ"
                >
                  <Link href="/dashboard">
                    <Home />
                    <span>Trang chủ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Supply Requests Dropdown */}
              <Collapsible defaultOpen={isRequestsActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      isActive={isRequestsActive}
                      tooltip="Yêu cầu vật tư"
                    >
                      <FileText />
                      <span>Yêu cầu vật tư</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {requestSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton 
                            asChild
                            isActive={pathname === item.url}
                          >
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span> 2024 Trường Việt Anh</span>
          </div>
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
