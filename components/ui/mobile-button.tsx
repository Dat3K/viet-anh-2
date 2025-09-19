'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useBreakpoint } from "@/hooks/use-mobile"

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Mobile-specific sizes
        "mobile-sm": "h-11 rounded-md px-3 text-base", // 44px min touch target
        "mobile-default": "h-12 px-4 py-2 text-base", // 48px touch target  
        "mobile-lg": "h-14 rounded-md px-8 text-lg", // 56px large touch target
        "mobile-icon": "h-11 w-11", // Square mobile touch target
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mobileButtonVariants> {
  asChild?: boolean
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const { isMobile } = useBreakpoint()
    const Comp = asChild ? Slot : "button"
    
    // Auto-adjust size for mobile if no mobile-specific size is provided
    const adaptiveSize = React.useMemo(() => {
      if (size?.startsWith('mobile-')) return size
      if (!isMobile) return size
      
      // Map desktop sizes to mobile equivalents
      switch (size) {
        case 'sm': return 'mobile-sm'
        case 'lg': return 'mobile-lg'
        case 'icon': return 'mobile-icon'
        default: return 'mobile-default'
      }
    }, [size, isMobile])
    
    return (
      <Comp
        className={cn(mobileButtonVariants({ variant, size: adaptiveSize, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileButton.displayName = "MobileButton"

export { MobileButton, mobileButtonVariants }
