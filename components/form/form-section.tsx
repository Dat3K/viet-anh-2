'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface FormSectionProps {
  title: string
  icon?: LucideIcon
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function FormSection({ 
  title, 
  icon: Icon, 
  children, 
  className = "",
  headerClassName = "",
  contentClassName = ""
}: FormSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className={headerClassName}>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${contentClassName}`}>
        {children}
      </CardContent>
    </Card>
  )
}
