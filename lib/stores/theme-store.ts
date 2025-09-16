import { combine } from 'zustand/middleware'
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'viet-anh-theme'

// Helper function to get system theme
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Helper function to resolve theme
const resolveTheme = (theme: Theme, systemTheme: 'light' | 'dark'): 'light' | 'dark' => {
  return theme === 'system' ? systemTheme : theme
}

// Helper function to apply theme to DOM
const applyTheme = (resolvedTheme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return
  
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff')
  }
}

// Create the store with combine middleware for better TypeScript inference
export const useThemeStore = createWithEqualityFn(
  combine(
    {
      theme: 'system' as Theme,
      resolvedTheme: 'light' as 'light' | 'dark',
      systemTheme: 'light' as 'light' | 'dark',
    },
    (set, get) => ({
      setTheme: (theme: Theme) => {
        const { systemTheme } = get()
        const resolvedTheme = resolveTheme(theme, systemTheme)
        
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, theme)
        }
        
        // Apply theme to DOM
        applyTheme(resolvedTheme)
        
        set({ theme, resolvedTheme })
      },

      initializeTheme: () => {
        if (typeof window === 'undefined') return
        
        // Get system theme
        const systemTheme = getSystemTheme()
        
        // Get stored theme or default to system
        const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
        const theme = storedTheme || 'system'
        
        // Resolve and apply theme
        const resolvedTheme = resolveTheme(theme, systemTheme)
        applyTheme(resolvedTheme)
        
        set({ theme, resolvedTheme, systemTheme })
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
          const newSystemTheme = e.matches ? 'dark' : 'light'
          const currentState = get()
          const newResolvedTheme = resolveTheme(currentState.theme, newSystemTheme)
          
          applyTheme(newResolvedTheme)
          set({ systemTheme: newSystemTheme, resolvedTheme: newResolvedTheme })
        }
        
        mediaQuery.addEventListener('change', handleSystemThemeChange)
        
        // Cleanup function (store this for potential cleanup)
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
      },

      updateSystemTheme: (systemTheme: 'light' | 'dark') => {
        const { theme } = get()
        const resolvedTheme = resolveTheme(theme, systemTheme)
        
        applyTheme(resolvedTheme)
        set({ systemTheme, resolvedTheme })
      },
    })
  ),
  shallow
)

// Optimized selectors to prevent unnecessary re-renders
export const useTheme = () => useThemeStore((state) => state.theme)
export const useResolvedTheme = () => useThemeStore((state) => state.resolvedTheme)
export const useSystemTheme = () => useThemeStore((state) => state.systemTheme)

// Actions selector (stable reference)
const STABLE_THEME_ACTIONS = {
  setTheme: (theme: Theme) => useThemeStore.getState().setTheme(theme),
  initializeTheme: () => useThemeStore.getState().initializeTheme(),
  updateSystemTheme: (systemTheme: 'light' | 'dark') => useThemeStore.getState().updateSystemTheme(systemTheme),
}

export const useThemeActions = () => STABLE_THEME_ACTIONS

// Combined hook for components that need both state and actions
export const useThemeState = () => useThemeStore(
  (state) => ({
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    systemTheme: state.systemTheme,
    setTheme: state.setTheme,
  }),
  shallow
)
