"use client"

import * as React from "react"
import { useThemeActions } from "@/lib/stores/theme-store"

interface ThemeProviderProps {
  children: React.ReactNode
  /**
   * Attribute name to use for the theme attribute on the document element
   * @default "class"
   */
  attribute?: "class" | "data-theme"
  /**
   * Default theme name (for v0.0.12 and lower the default was light)
   * @default "system"
   */
  defaultTheme?: "light" | "dark" | "system"
  /**
   * Whether to switch between dark and light themes based on prefers-color-scheme
   * @default true
   */
  enableSystem?: boolean
  /**
   * Disable all CSS transitions when switching themes
   * @default false
   */
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const { initializeTheme } = useThemeActions()
  
  React.useEffect(() => {
    // Initialize theme on mount
    const cleanup = initializeTheme()
    
    // Disable transitions during theme change if requested
    if (disableTransitionOnChange) {
      const css = document.createElement("style")
      css.appendChild(
        document.createTextNode(
          "*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
        )
      )
      document.head.appendChild(css)
      
      return () => {
        // Re-enable transitions after a frame
        window.getComputedStyle(css).opacity
        document.head.removeChild(css)
        
        // Call cleanup if it exists
        if (cleanup) cleanup()
      }
    }
    
    return cleanup
  }, [initializeTheme, disableTransitionOnChange])

  return <>{children}</>
}

// Script to prevent flash of unstyled content (FOUC)
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('viet-anh-theme') || 'system';
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        var resolvedTheme = theme === 'system' ? systemTheme : theme;
        
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolvedTheme);
        
        // Set theme-color meta tag
        var metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff');
        }
      } catch (e) {
        console.warn('Theme initialization failed:', e);
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  )
}
