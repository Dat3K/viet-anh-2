'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useBreakpoint } from "@/hooks/use-mobile"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const MobileOptimizedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const { isMobile } = useBreakpoint()
    
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          // Mobile-specific optimizations
          isMobile && "h-11 text-base", // Larger touch target and 16px+ font to prevent zoom on iOS
          !isMobile && "h-10 text-sm", // Standard desktop sizing
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileOptimizedInput.displayName = "MobileOptimizedInput"

export { MobileOptimizedInput }
