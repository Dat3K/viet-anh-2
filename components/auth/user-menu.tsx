'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth-query'
import { signOut } from '@/lib/auth/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Shield, Settings } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export function UserMenu() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Đang tải...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.email ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name || user.email)}` : undefined} alt={user.full_name || user.email || ''} />
            <AvatarFallback>
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {user.role && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                <span className="inline-flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role === 'admin' ? 'Quản trị viên' : 
                   user.role === 'manager' ? 'Trưởng bộ môn' : 
                   user.role === 'employee' ? 'Giáo viên' : user.role}
                </span>
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <button className="w-full text-left">
              <User className="mr-2 h-4 w-4" />
              <span>Hồ sơ</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <button className="w-full text-left">
              <Settings className="mr-2 h-4 w-4" />
              <span>Cài đặt</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full text-left text-destructive focus:text-destructive"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Đang đăng xuất...</span>
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </>
            )}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}