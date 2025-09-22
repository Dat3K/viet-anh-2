'use client'

import { 
  FileText, 
  Plus, 
  History,
  CheckCircle,
  ChevronRight,
  Home,
  User
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useBreakpoint } from "@/hooks/use-mobile"
import { useApprovalPermission } from "@/hooks/use-approval-permission"

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
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, isTablet } = useBreakpoint()
  const { state } = useSidebar()
  const { canApprove } = useApprovalPermission()

  // Base supply request items (always visible)
  const baseRequestItems = [
    {
      title: "Danh sách yêu cầu",
      url: "/supply-requests",
      icon: FileText,
    },
    {
      title: "Tạo yêu cầu",
      url: "/supply-requests/create",
      icon: Plus,
    },
    {
      title: "Lịch sử yêu cầu",
      url: "/supply-requests/history",
      icon: History,
    },
  ]

  // Approval item (conditional)
  const approvalItem = {
    title: "Phê duyệt yêu cầu",
    url: "/supply-requests/approve",
    icon: CheckCircle,
  }

  // Combine items based on permissions
  const requestSubItems = [
    ...baseRequestItems,
    // Only show approval item if user has permission
    ...(canApprove ? [approvalItem] : [])
  ]

  const isRequestsActive = pathname.startsWith('/supply-requests')
  const isDashboardActive = pathname === '/dashboard'
  const isProfileActive = pathname === '/profile'
  const isCollapsed = state === 'collapsed'

  // Determine dropdown positioning based on screen size
  const getDropdownProps = () => {
    const isOffcanvas = isMobile && state === 'expanded'
    
    if (isMobile || isTablet) {
      // On mobile/tablet, dropdown should open downward
      return {
        side: "bottom" as const,
        align: isOffcanvas ? "center" as const : "start" as const,
        className: "w-48",
        sideOffset: isOffcanvas ? 2 : 4,
      }
    }
    
    // On desktop, dropdown opens to the right
    return {
      side: "right" as const,
      align: "start" as const, 
      className: "w-48",
      sideOffset: 8,
    }
  }

  const dropdownProps = getDropdownProps()

  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
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

              {/* Profile */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isProfileActive}
                  tooltip="Hồ sơ cá nhân"
                >
                  <Link href="/profile">
                    <User />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Supply Requests - Dropdown when collapsed, Collapsible when expanded */}
              {isCollapsed ? (
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isRequestsActive}
                        tooltip="Yêu cầu vật tư"
                      >
                        <FileText />
                        <span>Yêu cầu vật tư</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      side={dropdownProps.side}
                      align={dropdownProps.align}
                      className={dropdownProps.className}
                      sideOffset={dropdownProps.sideOffset}
                    >
                      {requestSubItems.map((item) => (
                        <DropdownMenuItem key={item.title} asChild>
                          <Link 
                            href={item.url}
                            className="flex items-center gap-2 w-full"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ) : (
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
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Hệ thống Trường Việt Anh</span>
          </div>
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
