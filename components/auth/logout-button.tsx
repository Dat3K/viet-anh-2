'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Icons } from '@/components/ui/icons'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  className 
}: LogoutButtonProps) {
  const router = useRouter()
  const { signOut, isLoading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const response = await signOut()
      
      if (response.success) {
        // Redirect to login page after successful sign out
        router.push('/auth/login')
      }
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isSigningOut || isLoading}
    >
      {isSigningOut || isLoading ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Đang đăng xuất...
        </>
      ) : (
        <>
          <Icons.LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </>
      )}
    </Button>
  )
}