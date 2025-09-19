'use client'

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBreakpoint } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface MobileDataItem {
  id: string
  title: string
  subtitle?: string
  metadata?: Array<{
    label: string
    value: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
  }>
  badges?: Array<{
    content: React.ReactNode
    variant?: "default" | "secondary" | "destructive" | "outline"
  }>
  actions?: Array<{
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost"
  }>
}

interface MobileDataViewProps {
  items: MobileDataItem[]
  isLoading?: boolean
  emptyMessage?: string
  className?: string
  cardClassName?: string
}

export function MobileDataView({ 
  items, 
  isLoading = false, 
  emptyMessage = "Không có dữ liệu",
  className,
  cardClassName
}: MobileDataViewProps) {
  const { isMobile } = useBreakpoint()

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className={cn("animate-pulse", cardClassName)}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <Card className={cardClassName}>
        <CardContent className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <Card 
          key={item.id} 
          className={cn(
            "transition-colors hover:bg-muted/30",
            cardClassName
          )}
        >
          <CardContent className={cn(
            "p-4 space-y-3",
            isMobile && "p-3"
          )}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium leading-tight line-clamp-2",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className={cn(
                    "text-muted-foreground mt-1 line-clamp-1",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {item.subtitle}
                  </p>
                )}
              </div>
              
              {/* Actions */}
              {item.actions && item.actions.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                  {item.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size={isMobile ? "sm" : "sm"}
                      onClick={action.onClick}
                      className={cn(
                        isMobile && "h-8 px-2"
                      )}
                    >
                      {action.icon && (
                        <action.icon className="h-3 w-3" />
                      )}
                      {!isMobile && action.label && (
                        <span className="ml-1">{action.label}</span>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Badges */}
            {item.badges && item.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.badges.map((badge, index) => (
                  <Badge 
                    key={index} 
                    variant={badge.variant || "secondary"}
                    className={isMobile ? "text-xs" : "text-xs"}
                  >
                    {badge.content}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Metadata */}
            {item.metadata && item.metadata.length > 0 && (
              <div className={cn(
                "grid gap-2",
                isMobile ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
              )}>
                {item.metadata.map((meta, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    {meta.icon && (
                      <meta.icon className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span className="font-medium">{meta.label}:</span>
                    <span className="truncate">{meta.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Companion hook for converting table data to mobile format
export function useTableToMobileData<T>({
  data,
  keyExtractor,
  titleExtractor,
  subtitleExtractor,
  metadataExtractor,
  badgesExtractor,
  actionsExtractor,
}: {
  data: T[]
  keyExtractor: (item: T) => string
  titleExtractor: (item: T) => string
  subtitleExtractor?: (item: T) => string
  metadataExtractor?: (item: T) => MobileDataItem['metadata']
  badgesExtractor?: (item: T) => MobileDataItem['badges']
  actionsExtractor?: (item: T) => MobileDataItem['actions']
}): MobileDataItem[] {
  return React.useMemo(() => {
    return data.map((item) => ({
      id: keyExtractor(item),
      title: titleExtractor(item),
      subtitle: subtitleExtractor?.(item),
      metadata: metadataExtractor?.(item),
      badges: badgesExtractor?.(item),
      actions: actionsExtractor?.(item),
    }))
  }, [data, keyExtractor, titleExtractor, subtitleExtractor, metadataExtractor, badgesExtractor, actionsExtractor])
}
