'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useUserProfile } from '@/hooks/use-profile'
import { LogOut, User, Building2, UserCheck } from 'lucide-react'
import Link from 'next/link'

export function UserNav() {
  const { user, signOut, isSigningOut } = useAuth()
  const { profile, isLoading, error } = useUserProfile()

  if (!user) return null

  // Use profile data if available, fallback to user data
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const email = profile?.email || user.email || ''
  const department = profile?.department?.name
  const role = profile?.role?.name
  const employeeCode = profile?.employee_code
  
  // Generate initials from full name or email
  const initials = profile?.full_name
    ?.split(' ')
    ?.map(name => name[0])
    ?.join('')
    ?.substring(0, 2)
    ?.toUpperCase() || email
    ?.split('@')[0]
    ?.substring(0, 2)
    ?.toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
              {employeeCode && (
                <p className="text-xs leading-none text-muted-foreground">
                  Mã NV: {employeeCode}
                </p>
              )}
            </div>
            
            {/* Role and Department badges */}
            <div className="flex flex-wrap gap-1">
              {role && (
                <Badge variant="secondary" className="text-xs">
                  <UserCheck className="mr-1 h-3 w-3" />
                  {role}
                </Badge>
              )}
              {department && (
                <Badge variant="outline" className="text-xs">
                  <Building2 className="mr-1 h-3 w-3" />
                  {department}
                </Badge>
              )}
            </div>
            
            {/* Loading/Error states */}
            {isLoading && (
              <p className="text-xs text-muted-foreground italic">
                Đang tải thông tin...
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive italic">
                Lỗi tải thông tin
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ cá nhân</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          disabled={isSigningOut}
          variant="destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
