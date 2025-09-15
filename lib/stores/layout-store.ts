import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  // Sidebar state
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Mobile state
  isMobile: boolean
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  toggleSidebarCollapse: () => void
  setIsMobile: (mobile: boolean) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      isMobile: false,
      
      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      toggleSidebarCollapse: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setIsMobile: (mobile) => set({ 
        isMobile: mobile,
        // Auto-close sidebar on mobile
        sidebarOpen: mobile ? false : get().sidebarOpen
      }),
    }),
    {
      name: 'layout-storage',
      // Only persist sidebar preferences, not mobile state
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
