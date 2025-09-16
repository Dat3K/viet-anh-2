'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

interface ProfileData {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  employee_code?: string | null
  role?: {
    name: string
  } | null
  department?: {
    name: string
  } | null
}

interface ProfileInfoCardProps {
  profile: ProfileData | null
  isLoading?: boolean
  title?: string
  className?: string
}

export function ProfileInfoCard({ 
  profile, 
  isLoading = false, 
  title = "Thông tin người yêu cầu",
  className = ""
}: ProfileInfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {title}
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile ? (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <div className="grid grid-cols-1 gap-3">
              <ProfileField 
                label="Họ và tên" 
                value={profile.full_name || 'Chưa cập nhật'} 
              />
              
              <ProfileField 
                label="Email" 
                value={profile.email || 'Chưa cập nhật'} 
              />
              
              <ProfileField 
                label="Số điện thoại" 
                value={profile.phone || 'Chưa cập nhật'} 
              />
              
              <ProfileField 
                label="Mã nhân viên" 
                value={profile.employee_code || 'Chưa cập nhật'} 
              />
              
              {profile.role && (
                <ProfileField 
                  label="Chức vụ" 
                  value={profile.role.name} 
                />
              )}
              
              {profile.department && (
                <ProfileField 
                  label="Bộ phận" 
                  value={profile.department.name} 
                />
              )}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Không tìm thấy thông tin người dùng. Vui lòng kiểm tra lại hồ sơ cá nhân.
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}

interface ProfileFieldProps {
  label: string
  value: string
}

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
