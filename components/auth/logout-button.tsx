'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { LoaderCircle } from '../animate-ui/icons/loader-circle'
import { LogOutIcon } from 'lucide-react'

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
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Đang đăng xuất...
        </>
      ) : (
        <>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Đăng xuất
        </>
      )}
    </Button>
  )
}