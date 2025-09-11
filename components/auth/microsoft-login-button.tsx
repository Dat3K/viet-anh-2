'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, Shield, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth-query"
import { signInWithAzure } from "@/lib/auth/utils"

interface MicrosoftLoginButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function MicrosoftLoginButton({ 
  className, 
  variant = 'default', 
  size = 'default' 
}: MicrosoftLoginButtonProps) {
  const { isLoading } = useAuth()

  const handleLogin = async () => {
    try {
      await signInWithAzure()
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <Button 
      onClick={handleLogin}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
        </svg>
      )}
      {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Microsoft'}
    </Button>
  )
}

interface MicrosoftLoginCardProps {
  title?: string
  description?: string
  className?: string
}

export function MicrosoftLoginCard({ 
  title = "Đăng nhập vào hệ thống",
  description = "Sử dụng tài khoản Microsoft của bạn để truy cập hệ thống quản lý yêu cầu",
  className 
}: MicrosoftLoginCardProps) {
  const { error } = useAuth()

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
          </svg>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground text-sm">
          {description}
        </p>
        
        <div className="space-y-3">
          <MicrosoftLoginButton className="w-full" size="lg" />
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Bảo mật bởi Azure Active Directory</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive text-center">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Dành cho giáo viên, trưởng bộ môn và ban giám hiệu</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>Sử dụng email trường học (@vietanh.edu.vn)</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary" className="text-xs">
            Giáo viên
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Trưởng bộ môn
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Ban giám hiệu
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}