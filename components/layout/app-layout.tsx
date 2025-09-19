'use client'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"
import { useUserProfile } from '@/hooks/use-profile'
import { useBreakpoint } from '@/hooks/use-mobile'
import { TooltipProvider } from "@/components/ui/tooltip"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Initialize profile sync for the entire app
  useUserProfile()
  const { isMobile } = useBreakpoint()
  
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={!isMobile}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* Mobile-first padding with reduced spacing */}
          <div className="flex flex-1 flex-col gap-2 p-2 sm:gap-4 sm:p-4 md:p-6">
            <main className="flex-1 min-h-0">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
