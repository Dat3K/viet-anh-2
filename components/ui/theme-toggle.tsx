"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { useTheme, useResolvedTheme, useThemeActions, type Theme } from "@/lib/stores/theme-store"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "switch" | "dropdown" | "button"
  size?: "sm" | "default" | "lg"
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({ 
  variant = "dropdown", 
  size = "default",
  showLabel = false,
  className 
}: ThemeToggleProps) {
  const theme = useTheme()
  const resolvedTheme = useResolvedTheme()
  const { setTheme } = useThemeActions()

  if (variant === "switch") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Sun className="h-4 w-4" />
        <Switch
          checked={resolvedTheme === "dark"}
          onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
          aria-label="Chuyển đổi chế độ tối"
        />
        <Moon className="h-4 w-4" />
        {showLabel && (
          <Label className="text-sm font-medium">
            {resolvedTheme === "dark" ? "Chế độ tối" : "Chế độ sáng"}
          </Label>
        )}
      </div>
    )
  }

  if (variant === "button") {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : "icon"}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className={className}
        aria-label="Chuyển đổi chế độ tối/sáng"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        {showLabel && size !== "sm" && (
          <span className="ml-2 text-sm">
            {resolvedTheme === "dark" ? "Sáng" : "Tối"}
          </span>
        )}
      </Button>
    )
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={size === "sm" ? "sm" : "icon"}
          className={cn(
            "border-2 border-border/50 hover:border-border transition-colors",
            "hover:bg-accent/50 data-[state=open]:bg-accent data-[state=open]:border-primary/50",
            className
          )}
          aria-label="Chọn chế độ hiển thị"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Chuyển đổi chế độ hiển thị</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 p-2 shadow-lg border-2 border-border/20"
        sideOffset={8}
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent/80 focus:bg-accent/80",
            theme === "light" && "bg-accent text-accent-foreground font-medium"
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Chế độ sáng</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent/80 focus:bg-accent/80",
            theme === "dark" && "bg-accent text-accent-foreground font-medium"
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Chế độ tối</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent/80 focus:bg-accent/80",
            theme === "system" && "bg-accent text-accent-foreground font-medium"
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>Theo hệ thống</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simplified switch-only component for inline use
export function ThemeSwitch({ className, ...props }: { className?: string }) {
  const resolvedTheme = useResolvedTheme()
  const { setTheme } = useThemeActions()

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="flex items-center space-x-2">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <Switch
          checked={resolvedTheme === "dark"}
          onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
          {...props}
        />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium">
        {resolvedTheme === "dark" ? "Chế độ tối" : "Chế độ sáng"}
      </span>
    </div>
  )
}
